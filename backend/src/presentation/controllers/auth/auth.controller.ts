import { Request, Response } from 'express';
import {
  VerifyCredentialsUseCase,
  VerifyTotpLoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  ChangePasswordUseCase,
  RegenerateBackupCodesUseCase,
  ResetupTotpUseCase,
  GetBackupCodesUseCase,
} from '../../../application/use-cases/index.js';
import {
  RefreshTokenDTO,
  VerifyCredentialsDTO,
  VerifyTotpDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from '../../../application/dtos/index.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { extractIpAddress } from '../../utils/ip-address.util.js';
import { ResponseUtil } from '../../utils/response.util.js';
import {
  COOKIE_NAMES,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../../../infrastructure/config/cookie.config.js';

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
    private resetupTotpUseCase: ResetupTotpUseCase,
    private getBackupCodesUseCase: GetBackupCodesUseCase
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

      // For web clients, store tokens in secure HttpOnly cookies.
      // For automation/mobile clients that expect JSON tokens, they can still read them from the body if provided.
      res.cookie(COOKIE_NAMES.accessToken, result.accessToken, accessTokenCookieOptions);
      res.cookie(COOKIE_NAMES.refreshToken, result.refreshToken, refreshTokenCookieOptions);

      // Enterprise Approach: Only expose tokens in response body for non-web clients.
      // This prevents XSS-based token theft on web by keeping tokens in HttpOnly cookies.
      // We check the deviceType provided in the body or a custom header.
      const isWebClient = dto.deviceType === 'WEB' || req.headers['x-client-type'] === 'web';

      const responseData = isWebClient
        ? (({ accessToken, refreshToken, ...rest }) => rest)(result)
        : result;

      ResponseUtil.success(res, responseData, 'Login successful');
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
      // Prefer refresh token from cookie for web clients
      const cookieRefreshToken = req.cookies?.[COOKIE_NAMES.refreshToken] as string | undefined;

      let refreshToken: string | undefined = cookieRefreshToken;

      // Backward-compatible: allow body-based refresh token for non-web clients
      if (!refreshToken && req.body && (req.body as RefreshTokenDTO).refreshToken) {
        refreshToken = (req.body as RefreshTokenDTO).refreshToken;
      }

      if (!refreshToken) {
        ResponseUtil.unauthorized(res, 'Refresh token is required');
        return;
      }

      const result = await this.refreshTokenUseCase.execute({ refreshToken });

      // Rotate cookies for web clients
      if (cookieRefreshToken) {
        res.cookie(COOKIE_NAMES.accessToken, result.accessToken, accessTokenCookieOptions);
        res.cookie(COOKIE_NAMES.refreshToken, result.refreshToken, refreshTokenCookieOptions);
      }

      ResponseUtil.success(res, {
        expiresIn: result.expiresIn,
        // Keep tokens in response for explicit non-cookie clients
        accessToken: cookieRefreshToken ? undefined : result.accessToken,
        refreshToken: cookieRefreshToken ? undefined : result.refreshToken,
      });
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

      // Get session ID from request (set by authMiddleware) or explicitly in body/header
      const sessionId =
        req.sessionId || req.body.sessionId || (req.headers['x-session-id'] as string);

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      await this.logoutUseCase.execute(sessionId, req.user.id);

      // Clear auth cookies for web clients
      res.clearCookie(COOKIE_NAMES.accessToken, { path: '/' });
      res.clearCookie(COOKIE_NAMES.refreshToken, { path: '/' });

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

      await this.changePasswordUseCase.execute(
        req.user.id,
        {
          currentPassword,
          newPassword,
          totpCode,
        },
        {
          ipAddress,
          userAgent,
        }
      );

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

  /**
   * GET /api/auth/backup-codes
   * View current backup codes status
   */
  async getBackupCodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const result = await this.getBackupCodesUseCase.execute(req.user.id);

      ResponseUtil.success(res, result, 'Backup codes status retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get backup codes';
      ResponseUtil.error(res, 'GET_BACKUP_CODES_ERROR', message);
    }
  }
}
