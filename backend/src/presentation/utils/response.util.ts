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
  /**
   * Send a successful response
   * 
   * @param res Express response object
   * @param data Response data (optional)
   * @param message Success message (optional)
   * @param statusCode HTTP status code (default: 200)
   * @param meta Additional metadata (pagination, etc.)
   */
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

  /**
   * Send an error response
   * 
   * @param res Express response object
   * @param code Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
   * @param message Error message
   * @param statusCode HTTP status code (default: 400)
   * @param details Additional error details (optional)
   */
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

  /**
   * Send a success response with pagination metadata
   * 
   * @param res Express response object
   * @param data Response data
   * @param pagination Pagination metadata
   * @param message Success message (optional)
   * @param statusCode HTTP status code (default: 200)
   */
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

  /**
   * Send a created response (201)
   * 
   * @param res Express response object
   * @param data Response data
   * @param message Success message (optional)
   */
  static created<T>(
    res: Response,
    data: T,
    message?: string
  ): void {
    this.success(res, data, message || 'Resource created successfully', 201);
  }

  /**
   * Send a not found response (404)
   * 
   * @param res Express response object
   * @param message Error message (optional)
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    this.error(res, 'NOT_FOUND', message, 404);
  }

  /**
   * Send an unauthorized response (401)
   * 
   * @param res Express response object
   * @param message Error message (optional)
   */
  static unauthorized(
    res: Response,
    message: string = 'Authentication required'
  ): void {
    this.error(res, 'UNAUTHORIZED', message, 401);
  }

  /**
   * Send a forbidden response (403)
   * 
   * @param res Express response object
   * @param message Error message (optional)
   */
  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): void {
    this.error(res, 'FORBIDDEN', message, 403);
  }

  /**
   * Send a validation error response (400)
   * 
   * @param res Express response object
   * @param message Error message
   * @param details Validation details (optional)
   */
  static validationError(
    res: Response,
    message: string,
    details?: unknown
  ): void {
    this.error(res, 'VALIDATION_ERROR', message, 400, details);
  }

  /**
   * Send an internal server error response (500)
   * 
   * @param res Express response object
   * @param message Error message (optional)
   */
  static internalError(
    res: Response,
    message: string = 'Internal server error'
  ): void {
    this.error(res, 'INTERNAL_ERROR', message, 500);
  }
}
