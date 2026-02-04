export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const ENDPOINTS = {
  AUTH: {
    VERIFY_CREDENTIALS: '/auth/verify-credentials',
    VERIFY_TOTP: '/auth/verify-totp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
};
