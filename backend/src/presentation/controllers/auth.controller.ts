import { Request, Response } from 'express';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { RefreshTokenDTO, VerifyCredentialsDTO, VerifyTotpDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../../application/dtos/auth.dto';
import { RegenerateBackupCodesUseCase } from '../../application/use-cases/regenerate-backup-codes.use-case';
import { ResetupTotpUseCase } from '../../application/use-cases/resetup-totp.use-case';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { extractIpAddress } from '../utils/ip-address.util';
import { ResponseUtil } from '../utils/response.util';

export class AuthController {
  constructor(
    private verifyCredentialsUseCase: VerifyCredentialsUseCase,
    private verifyTotpLoginUseCase: VerifyTotpLoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase,
    private forgotPasswordUseCase: ForgotPasswordUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private changePasswordUseCase: ChangePasswordUseCase,
    private regenerateBackupCodesUseCase: RegenerateBackupCodesUseCase,
    private resetupTotpUseCase: ResetupTotpUseCase
  ) {}

  /**
   * POST /api/auth/verify-credentials
   * Step 1: Verify email and password, return temporary token (5 minutes) for TOTP verification
   */
  async verifyCredentials(req: Request, res: Response): Promise<void> {
    try {
      const dto: VerifyCredentialsDTO = req.body;

      // Get IP address and user agent for audit logging
      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      const result = await this.verifyCredentialsUseCase.execute(dto.email, dto.password, {
        ipAddress,
        userAgent,
        email: dto.email, // Pass email for audit logging
      });

      ResponseUtil.success(
        res,
        result,
        result.requiresTotp 
          ? 'Credentials verified. TOTP code required. Temporary token expires in 5 minutes.' 
          : 'Credentials verified.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credential verification failed';
      ResponseUtil.error(res, 'VERIFY_CREDENTIALS_ERROR', message);
    }
  }

  /**
   * POST /api/auth/verify-totp
   * Step 2: Verify TOTP code using temporary token, return access and refresh tokens
   */
  async verifyTotp(req: Request, res: Response): Promise<void> {
    try {
      const dto: VerifyTotpDTO = req.body;

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;
      const result = await this.verifyTotpLoginUseCase.execute(dto, {
        ipAddress,
        userAgent,
      });

      ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TOTP verification failed';
      // Check if error is due to expired temporary token
      if (message.includes('expired') || message.includes('Temporary token has expired')) {
        ResponseUtil.error(
          res,
          'TEMP_TOKEN_EXPIRED',
          'Temporary token has expired. Please verify credentials again. Temporary tokens expire in 5 minutes for security.',
          401
        );
        return;
      }
      ResponseUtil.error(res, 'VERIFY_TOTP_ERROR', message);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const dto: RefreshTokenDTO = req.body;

      const result = await this.refreshTokenUseCase.execute(dto);

      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      ResponseUtil.error(res, 'REFRESH_ERROR', message, 401);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Get session ID from request (could be in body or header)
      const sessionId = req.body.sessionId || req.headers['x-session-id'] as string;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      await this.logoutUseCase.execute(sessionId, req.user.id);

      ResponseUtil.success(res, undefined, 'Logged out successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      ResponseUtil.error(res, 'LOGOUT_ERROR', message);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset (sends reset token)
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const dto: ForgotPasswordDTO = req.body;

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      // Always return success to prevent email enumeration
      await this.forgotPasswordUseCase.execute(dto.email, {
        ipAddress,
        userAgent,
      });

      ResponseUtil.success(
        res,
        undefined,
        'If an account with that email exists, a password reset link has been sent.'
      );
    } catch (_error) {
      // Still return success to prevent email enumeration
      ResponseUtil.success(
        res,
        undefined,
        'If an account with that email exists, a password reset link has been sent.'
      );
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using reset token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const dto: ResetPasswordDTO = req.body;

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      await this.resetPasswordUseCase.execute(dto.token, dto.newPassword, {
        ipAddress,
        userAgent,
      });

      ResponseUtil.success(
        res,
        undefined,
        'Password has been reset successfully. All existing sessions have been invalidated.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      ResponseUtil.error(res, 'RESET_PASSWORD_ERROR', message);
    }
  }

  /**
   * POST /api/auth/change-password
   * Change password (requires authentication + current password + TOTP)
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { currentPassword, newPassword, totpCode } = req.body;

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

      ResponseUtil.success(
        res,
        undefined,
        'Password has been changed successfully. All existing sessions have been invalidated.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      ResponseUtil.error(res, 'CHANGE_PASSWORD_ERROR', message);
    }
  }

  /**
   * POST /api/auth/regenerate-backup-codes
   * Regenerate TOTP backup codes (requires password + TOTP)
   */
  async regenerateBackupCodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { password, totpCode } = req.body;

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      const result = await this.regenerateBackupCodesUseCase.execute(
        req.user.id,
        { password, totpCode },
        { ipAddress, userAgent }
      );

      ResponseUtil.success(
        res,
        result,
        'Backup codes regenerated successfully. Please save them securely.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to regenerate backup codes';
      ResponseUtil.error(res, 'REGENERATE_BACKUP_CODES_ERROR', message);
    }
  }

  /**
   * POST /api/auth/resetup-totp
   * Re-setup TOTP (requires password verification)
   */
  async resetupTotp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { password } = req.body;

      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;

      const result = await this.resetupTotpUseCase.execute(
        req.user.id,
        { password },
        { ipAddress, userAgent }
      );

      ResponseUtil.success(
        res,
        result,
        'TOTP re-setup successful. Please scan the QR code and verify with a TOTP code.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resetup TOTP';
      ResponseUtil.error(res, 'RESETUP_TOTP_ERROR', message);
    }
  }
}
