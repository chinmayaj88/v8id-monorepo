import apiClient from './apiClient';
import { LoginRequest, AuthResponse } from '../../features/auth/types/dtos';

export const authService = {
  // Step 1: Verify credentials -> Returns temporary token
  login: async (
    data: LoginRequest,
  ): Promise<{
    tempToken?: string;
    requiresTotp: boolean;
    message: string;
  }> => {
    const response = await apiClient.post<{
      data: { tempToken: string; requiresTotp: boolean };
      message: string;
    }>('/auth/verify-credentials', data);
    return {
      ...response.data.data,
      message: response.data.message,
    };
  },

  // Step 2: Verify TOTP -> Returns access/refresh tokens
  verifyTotp: async (data: {
    tempToken: string;
    totpCode: string;
    // Default device info for mobile app
    deviceType?: 'MOBILE';
    deviceName?: string;
    deviceId?: string;
  }): Promise<AuthResponse> => {
    const payload = {
      ...data,
      deviceType: 'MOBILE',
      deviceName: data.deviceName || 'React Native App',
      deviceId: data.deviceId || 'unknown-device-id', // In a real app, use react-native-device-info
    };
    const response = await apiClient.post<{ data: AuthResponse }>(
      '/auth/verify-totp',
      payload,
    );
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  updateProfile: async (data: FormData): Promise<{ user: any }> => {
    const response = await apiClient.post<{ data: { user: any } }>(
      '/users/profile',
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.data;
  },
};
