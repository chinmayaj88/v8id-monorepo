import { Request, Response } from 'express';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenDTO, VerifyCredentialsDTO, VerifyTotpDTO } from '../../application/dtos/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  constructor(
    private verifyCredentialsUseCase: VerifyCredentialsUseCase,
    private verifyTotpLoginUseCase: VerifyTotpLoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase
  ) {}

  /**
   * POST /api/auth/verify-credentials
   * Step 1: Verify email and password, return temporary token (5 minutes) for TOTP verification
   */
  async verifyCredentials(req: Request, res: Response): Promise<void> {
    try {
      const dto: VerifyCredentialsDTO = req.body;

      if (!dto.email || !dto.password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        });
        return;
      }

      const result = await this.verifyCredentialsUseCase.execute(dto.email, dto.password);

      res.status(200).json({
        success: true,
        data: result,
        message: result.requiresTotp 
          ? 'Credentials verified. TOTP code required. Temporary token expires in 5 minutes.' 
          : 'Credentials verified.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credential verification failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'VERIFY_CREDENTIALS_ERROR',
          message,
        },
      });
    }
  }

  /**
   * POST /api/auth/verify-totp
   * Step 2: Verify TOTP code using temporary token, return access and refresh tokens
   */
  async verifyTotp(req: Request, res: Response): Promise<void> {
    try {
      const dto: VerifyTotpDTO = req.body;

      if (!dto.tempToken || !dto.totpCode || !dto.deviceType || !dto.deviceName || !dto.deviceId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Temporary token, TOTP code, and device information are required',
          },
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const result = await this.verifyTotpLoginUseCase.execute(dto, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TOTP verification failed';
      // Check if error is due to expired temporary token
      if (message.includes('expired') || message.includes('Temporary token has expired')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TEMP_TOKEN_EXPIRED',
            message: 'Temporary token has expired. Please verify credentials again. Temporary tokens expire in 5 minutes for security.',
          },
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          code: 'VERIFY_TOTP_ERROR',
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

