/**
 * Input Validators
 * 
 * Validation schemas and logic for request validation using Zod.
 */

export * from './auth.validator';
export * from './user.validator';
export * from './file.validator';

export {
  createFolderSchema,
  updateFolderSchema,
  updateFileSchema,
  listFilesQuerySchema,
  listFoldersQuerySchema,
  initiateUploadSchema,
  chunkUploadSchema,
  completeUploadSchema,
} from './file.validator';

/**
 * Validation middleware factory
 * Creates Express middleware that validates request body against a Zod schema
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ResponseUtil } from '../utils/response.util';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and transform the request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a user-friendly response
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        ResponseUtil.validationError(res, 'Invalid request data', errors);
        return;
      }

      // Handle unexpected errors
      ResponseUtil.internalError(res, 'Validation failed');
    }
  };
}

/**
 * Validation middleware factory for query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and transform the query parameters
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        ResponseUtil.validationError(res, 'Invalid query parameters', errors);
        return;
      }

      ResponseUtil.internalError(res, 'Validation failed');
    }
  };
}

/**
 * Validation middleware factory for route parameters
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and transform the route parameters
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        ResponseUtil.validationError(res, 'Invalid route parameters', errors);
        return;
      }

      ResponseUtil.internalError(res, 'Validation failed');
    }
  };
}
