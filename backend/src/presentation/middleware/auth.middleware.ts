import { Request, Response, NextFunction } from 'express';
import { IJwtService } from '../../application/interfaces/jwt-service.interface';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { IDeviceSessionRepository } from '../../application/interfaces/device-session-repository.interface';
import { ResponseUtil } from '../utils/response.util';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  userRepository: IUserRepository,
  deviceSessionRepository: IDeviceSessionRepository,
  jwtService: IJwtService
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
        ResponseUtil.unauthorized(res, 'Missing or invalid authorization header');
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const payload = jwtService.verifyToken(token);

      // Verify user exists and is active
      const user = await userRepository.findById(payload.userId);
      if (!user || !user.isUserActive()) {
        ResponseUtil.unauthorized(res, 'User not found or inactive');
        return;
      }

      // TOKEN VERSIONING: Verify token version matches user's current version
      // If password was changed, tokenVersion increments and old tokens become invalid
      if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
        ResponseUtil.unauthorized(res, 'Token has been invalidated. Please login again.');
        return;
      }

      // CRITICAL: Verify session is still valid (not revoked)
      // Check if the access token belongs to an active, non-revoked session
      const session = await deviceSessionRepository.findByAccessToken(token);
      if (!session || session.isRevoked || !session.isActive || session.expiresAt < new Date()) {
        ResponseUtil.unauthorized(res, 'Session has been revoked or expired. Please login again.');
        return;
      }

      // Verify session belongs to the user from token
      if (session.userId !== payload.userId) {
        ResponseUtil.unauthorized(res, 'Session mismatch');
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
      ResponseUtil.unauthorized(res, 'Invalid or expired token');
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
      ResponseUtil.unauthorized(res);
      return;
    }

    if (req.user.role !== 'ADMIN') {
      ResponseUtil.forbidden(res, 'Admin access required');
      return;
    }

    next();
  };
}

