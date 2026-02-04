import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to add Token
apiClient.interceptors.request.use(
  config => {
    // In a real app, you might read this from HttpOnly cookies (handled by browser)
    // or from local storage if security requirements allow (e.g., shorter lived tokens).
    // For this implementation, we'll assume we store the Access Token in memory/storage
    // for simplicity, but acknowledge HttpOnly cookies are better.
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor for Error Handling and potential Refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token Expiry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Attempt refresh token logic here if implemented
      // const refreshToken = localStorage.getItem('refreshToken');
      // ... call refresh endpoint
    }

    return Promise.reject(error);
  }
);
