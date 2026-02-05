import type { CookieOptions } from 'express';
import { envConfig } from './env.config.js';

const isProduction = envConfig.nodeEnv === 'production';

export const COOKIE_NAMES = {
  accessToken: 'v8id_access_token',
  refreshToken: 'v8id_refresh_token',
  csrfToken: 'v8id_csrf_token',
} as const;

export const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'lax' : 'lax',
  path: '/',
};

export const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
};

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? 'lax' : 'lax',
  path: '/',
};

