import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { getDeviceId, getDeviceName } from '@/utils/device';

// Types
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  tempToken: string | null;
  isAuthenticated: boolean;
  requiresTotp: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  tempToken: null,
  isAuthenticated: false,
  requiresTotp: false,
  isLoading: false,
  error: null,
};

// Async Thunks
export const verifyCredentials = createAsyncThunk<
  any,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/verifyCredentials',
  async (credentials: { email: string; password: string }, { rejectWithValue }: any) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.VERIFY_CREDENTIALS, credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const verifyTotp = createAsyncThunk<
  any,
  { totpCode: string; tempToken: string },
  { rejectValue: string }
>(
  'auth/verifyTotp',
  async (data: { totpCode: string; tempToken: string }, { rejectWithValue }: any) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.VERIFY_TOTP, {
        ...data,
        deviceType: 'WEB',
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
  }
);

export const forgotPassword = createAsyncThunk<any, string, { rejectValue: string }>(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }: any) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Request failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state: AuthState) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.requiresTotp = false;
      state.tempToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
    clearError: (state: AuthState) => {
      state.error = null;
    },
  },
  extraReducers: (builder: any) => {
    // Verify Credentials
    builder.addCase(verifyCredentials.pending, (state: AuthState) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyCredentials.fulfilled, (state: AuthState, action: PayloadAction<any>) => {
      state.isLoading = false;
      const { data } = action.payload; // Assuming standard response structure

      if (data.requiresTotp) {
        state.requiresTotp = true;
        state.tempToken = data.tempToken; // Backend should return this
      } else {
        // Direct Login Success
        state.isAuthenticated = true;
        state.accessToken = data.accessToken;
        state.user = data.user;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.accessToken);
        }
      }
    });
    builder.addCase(verifyCredentials.rejected, (state: AuthState, action: any) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Verify TOTP
    builder.addCase(verifyTotp.pending, (state: AuthState) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyTotp.fulfilled, (state: AuthState, action: PayloadAction<any>) => {
      state.isLoading = false;
      const { data } = action.payload;
      state.isAuthenticated = true;
      state.requiresTotp = false;
      state.tempToken = null;
      state.accessToken = data.accessToken;
      state.user = data.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    });
    builder.addCase(verifyTotp.rejected, (state: AuthState, action: any) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Forgot Password
    builder.addCase(forgotPassword.pending, (state: AuthState) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.fulfilled, (state: AuthState) => {
      state.isLoading = false;
      // logic is handled in component (success message)
    });
    builder.addCase(forgotPassword.rejected, (state: AuthState, action: any) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
