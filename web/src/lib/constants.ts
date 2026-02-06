export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const ENDPOINTS = {
  AUTH: {
    VERIFY_CREDENTIALS: '/auth/verify-credentials',
    VERIFY_TOTP: '/auth/verify-totp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    BACKUP_CODES: '/auth/backup-codes',
    REGENERATE_BACKUP_CODES: '/auth/regenerate-backup-codes',
  },
  USER: {
    PROFILE: '/users/me/profile',
    SESSIONS: '/users/me/sessions',
    REVOKE_SESSION: (id: string) => `/users/me/sessions/${id}`,
    REVOKE_ALL_SESSIONS: '/users/me/sessions/revoke-all',
    LIST: '/users',
    CREATE: '/users',
  },
};
