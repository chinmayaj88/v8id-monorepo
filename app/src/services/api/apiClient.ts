import axios from 'axios';
import { API_URL } from '@env';

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
    // We will import store here dynamically to avoid circular dependencies if needed,
    // or use a better pattern like a token manager.
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    console.error('[API Error]', message);
    return Promise.reject(error);
  },
);

export default apiClient;
