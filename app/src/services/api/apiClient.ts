import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Enterprise default
});

// Request interceptor for API tokens
apiClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from storage', e);
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for global error handling and token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle 401 and avoid infinite loops
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('📡 [Auth] Refreshing access token...');
        // Use standard axios to avoid interceptor loop for the refresh call itself
        const refreshResponse = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {
            refreshToken,
          },
        );

        if (refreshResponse.data?.success) {
          const { accessToken, refreshToken: newRefreshToken } =
            refreshResponse.data.data;

          console.log('✅ [Auth] Token refreshed successfully');
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          // Update instance defaults and the failed request headers
          apiClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return apiClient.request(originalRequest);
        }
      } catch (refreshError) {
        console.error(
          '❌ [Auth] Refresh failed, session expired:',
          refreshError,
        );
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Here you could broadcast a logout event
      }
    }

    // Default error handling
    const message =
      error.response?.data?.message || error.message || 'Network Error';
    console.error(`[API Error ${error.response?.status || 'ERR'}]:`, message);

    return Promise.reject(error);
  },
);

export default apiClient;
