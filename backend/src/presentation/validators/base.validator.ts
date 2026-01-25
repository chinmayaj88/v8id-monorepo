import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ResponseUtil } from '../utils/response.util.js';

/**
 * Robust check for ZodError that works across multiple instances/versions
 */
const isZodError = (error: any): error is ZodError => {
  return (
    error instanceof ZodError ||
    (error && typeof error === 'object' && error.name === 'ZodError' && Array.isArray(error.issues))
  );
};

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body || {});
      next();
    } catch (error) {
      if (isZodError(error)) {
        return ResponseUtil.validationError(res, error.issues[0]?.message || 'Validation failed');
      }
      return ResponseUtil.internalError(res, 'Validation failed');
    }
  };
};

/**
 * Middleware to validate request query against a Zod schema
 */
export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);

      Object.defineProperty(req, 'query', {
        value: validated,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      next();
    } catch (error) {
      if (isZodError(error)) {
        return ResponseUtil.validationError(
          res,
          error.issues[0]?.message || 'Query validation failed'
        );
      }
      return ResponseUtil.internalError(res, 'Query validation failed');
    }
  };
};

/**
 * Middleware to validate request params against a Zod schema
 */
export const validateParams = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);

      Object.defineProperty(req, 'params', {
        value: validated,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      next();
    } catch (error) {
      if (isZodError(error)) {
        return ResponseUtil.validationError(
          res,
          error.issues[0]?.message || 'Params validation failed'
        );
      }
      return ResponseUtil.internalError(res, 'Params validation failed');
    }
  };
};
