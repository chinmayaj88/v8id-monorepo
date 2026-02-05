import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

// Create Axios Instance – rely on HttpOnly cookies for auth
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add CSRF token (Synchronizer Token Pattern)
apiClient.interceptors.request.use(config => {
  // Only add for non-GET requests if possible, or just add to all
  if (typeof document !== 'undefined') {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('v8id_csrf_token='))
      ?.split('=')[1];

    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }

  // Also add client type for backend detection
  config.headers['x-client-type'] = 'web';

  return config;
});

// Basic response interceptor (kept for future enhancements like refresh logic)
apiClient.interceptors.response.use(
  response => response,
  async error => {
    return Promise.reject(error);
  }
);
