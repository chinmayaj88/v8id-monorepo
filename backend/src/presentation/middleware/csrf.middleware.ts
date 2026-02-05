import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { COOKIE_NAMES, csrfCookieOptions } from '../../infrastructure/config/cookie.config.js';

const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();

  // Only enforce CSRF on state-changing requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  // Skip CSRF check if the request is using Bearer token authentication.
  // Bearer tokens are sent in a header, which is not automatically sent by browsers
  // for cross-origin requests, thus making them inherently safe from CSRF.
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const csrfCookie = req.cookies?.[COOKIE_NAMES.csrfToken] as string | undefined;
  const csrfHeader = (req.headers[CSRF_HEADER_NAME] as string | undefined) || undefined;

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token',
      },
    });
    return;
  }

  next();
}

export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const existingToken = req.cookies?.[COOKIE_NAMES.csrfToken] as string | undefined;
  const token = existingToken || generateCsrfToken();

  res.cookie(COOKIE_NAMES.csrfToken, token, csrfCookieOptions);

  // Expose token in a header for clients that need to read it on first load
  res.setHeader('x-csrf-token', token);

  next();
}
