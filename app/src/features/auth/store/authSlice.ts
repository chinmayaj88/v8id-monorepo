import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, AuthResponse } from '../types';
import { authService } from '../../../services/api/authService';
import { databaseService } from '../../../services/db/DatabaseService';
import { SecureStorage } from '../../../services/security/SecureStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tempToken: string | null; // For TOTP flow
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  tempToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

// Initialize auth from storage
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      const tokens = await SecureStorage.getTokens();
      const userJson = await AsyncStorage.getItem('user');

      if (tokens && userJson) {
        const user = JSON.parse(userJson);
        return {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        };
      }
      return null;
    } catch (e) {
      console.error('Failed to load auth from storage', e);
      return null;
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // Step 1: Verify credentials, get temp token
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Login failed. Please check your credentials.',
      );
    }
  },
);

export const verifyTotp = createAsyncThunk(
  'auth/verifyTotp',
  async (
    data: { tempToken: string; totpCode: string },
    { rejectWithValue },
  ) => {
    try {
      // Step 2: Verify TOTP, get access tokens
      const response = await authService.verifyTotp(data);

      // Store in Secure Storage (Keychain)
      await SecureStorage.saveTokens(
        response.accessToken,
        response.refreshToken,
      );
      // User data can stay in AsyncStorage for fast access to profile
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Invalid verification code.',
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send reset link.',
      );
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      return response.user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile.',
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      console.warn('Backend logout failed', error);
      // We still continue to clear local storage
    } finally {
      await SecureStorage.clearTokens();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('lastSyncTimestamp');
      databaseService.deleteSchema();
    }
  },
);

// --- Slice Definition ---

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    logout: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tempToken = null;
      state.isAuthenticated = false;
      SecureStorage.clearTokens().catch(() => {});
      AsyncStorage.removeItem('user').catch(() => {});
      AsyncStorage.removeItem('lastSyncTimestamp').catch(() => {});
      databaseService.deleteSchema();
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Initialize Auth
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      if (action.payload) {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    });

    // Login
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
        state.tempToken = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;

        // Backend returns { tempToken, requiresTotp, message }
        if (action.payload.tempToken) {
          state.tempToken = action.payload.tempToken;
        }
        // Do NOT authenticate yet.
        // UI will navigate to TOTP screen based on `tempToken`
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // TOTP
    builder
      .addCase(verifyTotp.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTotp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tempToken = null; // Clear temp token
        state.isAuthenticated = true;
      })
      .addCase(verifyTotp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tempToken = null;
      state.isAuthenticated = false;
    });
    builder.addCase(logoutUser.rejected, state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tempToken = null;
      state.isAuthenticated = false;
    });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
