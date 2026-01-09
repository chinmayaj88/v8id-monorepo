/**
 * Rate Limiting Middleware
 * 
 * Protects endpoints from brute force attacks and abuse.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP (prevents brute force)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later.',
      },
    });
  },
});

/**
 * TOTP verification rate limiter
 * 10 requests per 15 minutes per IP
 */
export const totpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 TOTP attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many TOTP verification attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many TOTP verification attempts, please try again later.',
      },
    });
  },
});

/**
 * Token refresh rate limiter
 * 20 requests per 15 minutes per IP
 */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 refresh attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many token refresh attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many token refresh attempts, please try again later.',
      },
    });
  },
});
