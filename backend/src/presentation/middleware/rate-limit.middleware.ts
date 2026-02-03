/**
 * Rate Limiting Middleware
 *
 * Protects endpoints from brute force attacks and abuse.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util.js';
import { envConfig } from '../../infrastructure/config/env.config.js';

// Skip rate limiting in development
const skipInDev = () => envConfig.nodeEnv === 'development';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipInDev,
  handler: (_req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests from this IP, please try again later.',
      429
    );
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP (prevents brute force)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: skipInDev,
  handler: (_req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many login attempts, please try again later.',
      429
    );
  },
});

/**
 * TOTP verification rate limiter
 * 10 requests per 15 minutes per IP
 */
export const totpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 TOTP attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many TOTP verification attempts, please try again later.',
      429
    );
  },
});

/**
 * Token refresh rate limiter
 * 20 requests per 15 minutes per IP
 */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 refresh attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many token refresh attempts, please try again later.',
      429
    );
  },
});

/**
 * Strict rate limiter for resource-heavy mutations
 * 30 requests per 15 minutes per IP
 */
export const strictMutationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit each IP to 30 mutations per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many write requests, please try again later.',
      429
    );
  },
});
