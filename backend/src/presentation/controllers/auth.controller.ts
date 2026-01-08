import { Request, Response } from 'express';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { RefreshTokenDTO, VerifyCredentialsDTO, VerifyTotpDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../../application/dtos/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { extractIpAddress } from '../utils/ip-address.util';

export class AuthController {
  constructor(
    private verifyCredentialsUseCase: VerifyCredentialsUseCase,
    private verifyTotpLoginUseCase: VerifyTotpLoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase,
    private forgotPasswordUseCase: ForgotPasswordUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private changePasswordUseCase: ChangePasswordUseCase
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

      // Get IP address and user agent for audit logging
      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      const result = await this.verifyCredentialsUseCase.execute(dto.email, dto.password, {
        ipAddress,
        userAgent,
        email: dto.email, // Pass email for audit logging
      });

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

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;
      const result = await this.verifyTotpLoginUseCase.execute(dto, {
        ipAddress,
        userAgent,
      });

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

  /**
   * POST /api/auth/forgot-password
   * Request password reset (sends reset token)
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const dto: ForgotPasswordDTO = req.body;

      if (!dto.email) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required',
          },
        });
        return;
      }

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      // Always return success to prevent email enumeration
      await this.forgotPasswordUseCase.execute(dto.email, {
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      // Still return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using reset token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const dto: ResetPasswordDTO = req.body;

      if (!dto.token || !dto.newPassword) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token and new password are required',
          },
        });
        return;
      }

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      await this.resetPasswordUseCase.execute(dto.token, dto.newPassword, {
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. All existing sessions have been invalidated.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'RESET_PASSWORD_ERROR',
          message,
        },
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Change password (requires authentication + current password + TOTP)
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { currentPassword, newPassword, totpCode } = req.body;

      if (!currentPassword || !newPassword || !totpCode) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password, new password, and TOTP code are required',
          },
        });
        return;
      }

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      await this.changePasswordUseCase.execute(req.user.id, {
        currentPassword,
        newPassword,
        totpCode,
      }, {
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        success: true,
        message: 'Password has been changed successfully. All existing sessions have been invalidated.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'CHANGE_PASSWORD_ERROR',
          message,
        },
      });
    }
  }
}

