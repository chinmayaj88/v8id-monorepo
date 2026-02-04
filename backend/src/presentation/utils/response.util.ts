/**
 * Standardized API Response Utility
 *
 * Ensures all API responses follow a consistent structure for frontend consumption.
 */

import { Response } from 'express';

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Response utility class for standardized API responses
 */
export class ResponseUtil {
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200,
    meta?: Record<string, unknown>
  ): void {
    const response: ApiResponse<T> = {
      success: true,
    };

    if (data !== undefined) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    if (meta) {
      response.meta = meta;
    }

    res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 400,
    details?: unknown
  ): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (details !== undefined) {
      response.error!.details = details;
    }

    res.status(statusCode).json(response);
  }

  static successWithPagination<T>(
    res: Response,
    data: T,
    pagination: PaginationMeta,
    message?: string,
    statusCode: number = 200
  ): void {
    this.success(res, data, message, statusCode, {
      pagination,
    });
  }

  static created<T>(res: Response, data: T, message?: string): void {
    this.success(res, data, message || 'Resource created successfully', 201);
  }

  static notFound(res: Response, message: string = 'Resource not found'): void {
    this.error(res, 'NOT_FOUND', message, 404);
  }

  static unauthorized(res: Response, message: string = 'Authentication required'): void {
    this.error(res, 'UNAUTHORIZED', message, 401);
  }

  static forbidden(res: Response, message: string = 'Access forbidden'): void {
    this.error(res, 'FORBIDDEN', message, 403);
  }

  static validationError(res: Response, message: string, details?: unknown): void {
    this.error(res, 'VALIDATION_ERROR', message, 400, details);
  }

  static internalError(res: Response, message: string = 'Internal server error'): void {
    this.error(res, 'INTERNAL_ERROR', message, 500);
  }
}
