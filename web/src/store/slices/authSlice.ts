import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { getDeviceId, getDeviceName } from '@/utils/device';

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  storageQuota: string;
  storageUsed: string;
  storagePercentage: number;
  storageUsedFormatted: string;
  storageQuotaFormatted: string;
  totpEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  tempToken: string | null;
  isAuthenticated: boolean;
  requiresTotp: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  tempToken: null,
  isAuthenticated: false,
  requiresTotp: false,
  isLoading: true, // Default to true to prevent flicker
  isInitialized: false,
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
    setAuthenticatedUser: (state: AuthState, action: PayloadAction<User | null>) => {
      const user = action.payload;
      if (user) {
        // Calculate formatted strings if they aren't provided by backend
        const quota = parseFloat(user.storageQuota);
        const used = parseFloat(user.storageUsed);

        const formatSize = (bytes: number): string => {
          if (isNaN(bytes) || bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        user.storageUsedFormatted = formatSize(used);
        user.storageQuotaFormatted = formatSize(quota);
        user.storagePercentage = quota > 0 ? Math.round((used / quota) * 100) : 0;
      }

      state.user = user;
      state.isAuthenticated = !!user;
      state.isLoading = false;
      state.isInitialized = true;
    },
    setLoading: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    logout: (state: AuthState) => {
      state.user = null;
      state.isAuthenticated = false;
      state.requiresTotp = false;
      state.isInitialized = true;
      state.tempToken = null;
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
        state.user = data.user;
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
      state.user = data.user;
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

export const { setAuthenticatedUser, setLoading, setInitialized, logout, clearError } =
  authSlice.actions;
export default authSlice.reducer;
