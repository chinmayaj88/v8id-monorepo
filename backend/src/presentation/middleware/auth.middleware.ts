/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user information to the request.
 */

import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { IDeviceSessionRepository } from '../../application/interfaces/device-session-repository.interface';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  userRepository: IUserRepository,
  deviceSessionRepository: IDeviceSessionRepository
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid authorization header',
          },
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const payload = JwtService.verifyToken(token);

      // Verify user exists and is active
      const user = await userRepository.findById(payload.userId);
      if (!user || !user.isUserActive()) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found or inactive',
          },
        });
        return;
      }

      // CRITICAL: Verify session is still valid (not revoked)
      // Check if the access token belongs to an active, non-revoked session
      const session = await deviceSessionRepository.findByAccessToken(token);
      if (!session || session.isRevoked || !session.isActive || session.expiresAt < new Date()) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Session has been revoked or expired. Please login again.',
          },
        });
        return;
      }

      // Verify session belongs to the user from token
      if (session.userId !== payload.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Session mismatch',
          },
        });
        return;
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }
  };
}

/**
 * Admin-only middleware
 */
export function adminMiddleware() {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      return;
    }

    next();
  };
}

