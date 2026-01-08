/**
 * Input Validation Middleware
 * 
 * Provides basic input sanitization and validation.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize string input - remove dangerous characters
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove null bytes and control characters
  return input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize email input
 */
function sanitizeEmail(email: string): string {
  return sanitizeString(email).toLowerCase();
}

/**
 * Basic input sanitization middleware
 * Sanitizes string fields in request body
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    // Sanitize string fields
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Special handling for email fields
        if (key.toLowerCase().includes('email')) {
          req.body[key] = sanitizeEmail(req.body[key]);
        } else {
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }

  next();
}

/**
 * Validate required fields in request body
 */
export function validateRequired(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const field of fields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missing.join(', ')}`,
          fields: missing,
        },
      });
      return;
    }

    next();
  };
}
