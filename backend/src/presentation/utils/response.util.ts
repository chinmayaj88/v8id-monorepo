import type { Response } from 'express';

/**
 * API Response structure
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standardized response utility
 * Single Responsibility: Only handles response formatting
 */
export class ResponseUtil {
  /**
   * Send a successful response
   */
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created<T>(res: Response, data: T): void {
    ResponseUtil.success(res, data, 201);
  }

  /**
   * Send a no content response (204)
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 400,
    details?: unknown
  ): void {
    const error: ApiResponse['error'] = {
      code,
      message,
    };
    if (details !== undefined) {
      error!.details = details;
    }
    const response: ApiResponse = {
      success: false,
      error,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send a not found error (404)
   */
  static notFound(res: Response, message: string = 'Resource not found'): void {
    ResponseUtil.error(res, 'NOT_FOUND', message, 404);
  }

  /**
   * Send an unauthorized error (401)
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    ResponseUtil.error(res, 'UNAUTHORIZED', message, 401);
  }

  /**
   * Send a forbidden error (403)
   */
  static forbidden(res: Response, message: string = 'Forbidden'): void {
    ResponseUtil.error(res, 'FORBIDDEN', message, 403);
  }

  /**
   * Send an internal server error (500)
   */
  static internalError(res: Response, message: string = 'Internal server error'): void {
    ResponseUtil.error(res, 'INTERNAL_ERROR', message, 500);
  }

  /**
   * Send a validation error (422)
   */
  static validationError(res: Response, details: unknown): void {
    ResponseUtil.error(res, 'VALIDATION_ERROR', 'Validation failed', 422, details);
  }
}
