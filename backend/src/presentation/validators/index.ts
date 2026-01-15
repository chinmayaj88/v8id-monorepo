/**
 * Input Validators
 * 
 * Validation schemas and logic for request validation using Zod.
 */

export * from './auth.validator.js';
export * from './user.validator.js';
export * from './file.validator.js';

export {
  createFolderSchema,
  updateFolderSchema,
  updateFileSchema,
  listFilesQuerySchema,
  listFoldersQuerySchema,
  initiateUploadSchema,
  chunkUploadSchema,
  completeUploadSchema,
} from './file.validator.js';

/**
 * Validation middleware factory
 * Creates Express middleware that validates request body against a Zod schema
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ResponseUtil } from '../utils/response.util.js';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        ResponseUtil.validationError(res, 'Invalid request data', errors);
        return;
      }

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
