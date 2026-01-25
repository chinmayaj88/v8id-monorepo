import type { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util.js';

/**
 * Global error handling middleware
 * Single Responsibility: Only handles error responses
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Unhandled error:', err);

  // Check if response was already sent
  if (res.headersSent) {
    return;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    ResponseUtil.validationError(res, err.message);
    return;
  }

  if (err.name === 'UnauthorizedError') {
    ResponseUtil.unauthorized(res, err.message);
    return;
  }

  // Default to internal server error
  ResponseUtil.internalError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  );
}

