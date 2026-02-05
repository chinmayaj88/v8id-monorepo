import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '@/lib/constants';

// Create Axios Instance – rely on HttpOnly cookies for auth
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Variables to handle multiple concurrent 401s
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

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

// Response interceptor for automatic refresh logic
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If it's the refresh endpoint itself failing, just reject
      if (originalRequest.url?.includes(ENDPOINTS.AUTH.REFRESH)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post(ENDPOINTS.AUTH.REFRESH);
        isRefreshing = false; // Reset before processing queue
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false; // Reset before processing queue
        processQueue(refreshError);

        // If refresh fails, we should logout the user
        if (typeof window !== 'undefined') {
          import('@/store').then(({ store }) => {
            store.dispatch({ type: 'auth/logout' });
          });
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
