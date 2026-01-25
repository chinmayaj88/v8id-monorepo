import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ResponseUtil } from '../utils/response.util.js';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.validationError(
          res,
          error.issues[0]?.message || 'Params validation failed'
        );
      }
      return ResponseUtil.internalError(res, 'Params validation failed');
    }
  };
};
