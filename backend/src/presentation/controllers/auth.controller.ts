/**
 * Authentication Controller
 * 
 * Handles authentication-related HTTP requests.
 */

import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginDTO, RefreshTokenDTO } from '../../application/dtos/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase
  ) {}

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const dto: LoginDTO = req.body;

      // Validate required fields
      if (!dto.email || !dto.password || !dto.deviceType || !dto.deviceName || !dto.deviceId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
          },
        });
        return;
      }

      // Get IP address from request
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;

      const result = await this.loginUseCase.execute(dto, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message,
        },
      });
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const dto: RefreshTokenDTO = req.body;

      if (!dto.refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
          },
        });
        return;
      }

      const result = await this.refreshTokenUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message,
        },
      });
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      // Get session ID from request (could be in body or header)
      const sessionId = req.body.sessionId || req.headers['x-session-id'] as string;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Session ID is required',
          },
        });
        return;
      }

      await this.logoutUseCase.execute(sessionId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message,
        },
      });
    }
  }
}

