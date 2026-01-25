/**
 * Auth Dependency Injection Container
 */

import { sharedContainer } from '../shared/shared.container.js';
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
import { AuthController } from '../../../presentation/controllers/index.js';

export class AuthContainer {
  private static instance: AuthContainer;

  // Use Cases
  public readonly verifyCredentialsUseCase: VerifyCredentialsUseCase;
  public readonly verifyTotpLoginUseCase: VerifyTotpLoginUseCase;
  public readonly refreshTokenUseCase: RefreshTokenUseCase;
  public readonly logoutUseCase: LogoutUseCase;
  public readonly forgotPasswordUseCase: ForgotPasswordUseCase;
  public readonly resetPasswordUseCase: ResetPasswordUseCase;
  public readonly changePasswordUseCase: ChangePasswordUseCase;
  public readonly regenerateBackupCodesUseCase: RegenerateBackupCodesUseCase;
  public readonly resetupTotpUseCase: ResetupTotpUseCase;
  public readonly getBackupCodesUseCase: GetBackupCodesUseCase;

  // Controller
  public readonly authController: AuthController;

  private constructor() {
    this.verifyCredentialsUseCase = new VerifyCredentialsUseCase(
      sharedContainer.userRepository,
      sharedContainer.passwordService,
      sharedContainer.jwtService,
      sharedContainer.auditLogService,
      sharedContainer.accountLockoutService,
      sharedContainer.suspiciousActivityService,
      sharedContainer.emailService
    );

    this.verifyTotpLoginUseCase = new VerifyTotpLoginUseCase(
      sharedContainer.userRepository,
      sharedContainer.deviceSessionRepository,
      sharedContainer.emailService,
      sharedContainer.totpService,
      sharedContainer.jwtService,
      sharedContainer.suspiciousActivityService,
      sharedContainer.auditLogService,
      sharedContainer.storageService
    );

    this.refreshTokenUseCase = new RefreshTokenUseCase(
      sharedContainer.deviceSessionRepository,
      sharedContainer.userRepository,
      sharedContainer.jwtService,
      sharedContainer.auditLogService
    );

    this.logoutUseCase = new LogoutUseCase(
      sharedContainer.deviceSessionRepository,
      sharedContainer.auditLogService
    );

    this.forgotPasswordUseCase = new ForgotPasswordUseCase(
      sharedContainer.userRepository,
      sharedContainer.auditLogService,
      sharedContainer.emailService
    );

    this.resetPasswordUseCase = new ResetPasswordUseCase(
      sharedContainer.userRepository,
      sharedContainer.passwordService,
      sharedContainer.auditLogService
    );

    this.changePasswordUseCase = new ChangePasswordUseCase(
      sharedContainer.userRepository,
      sharedContainer.passwordService,
      sharedContainer.totpService,
      sharedContainer.auditLogService,
      sharedContainer.emailService
    );

    this.regenerateBackupCodesUseCase = new RegenerateBackupCodesUseCase(
      sharedContainer.userRepository,
      sharedContainer.totpBackupCodeRepository,
      sharedContainer.passwordService,
      sharedContainer.totpService,
      sharedContainer.auditLogService
    );

    this.resetupTotpUseCase = new ResetupTotpUseCase(
      sharedContainer.userRepository,
      sharedContainer.totpBackupCodeRepository,
      sharedContainer.passwordService,
      sharedContainer.totpService,
      sharedContainer.auditLogService
    );

    this.getBackupCodesUseCase = new GetBackupCodesUseCase(
      sharedContainer.totpBackupCodeRepository
    );

    this.authController = new AuthController(
      this.verifyCredentialsUseCase,
      this.verifyTotpLoginUseCase,
      this.refreshTokenUseCase,
      this.logoutUseCase,
      this.forgotPasswordUseCase,
      this.resetPasswordUseCase,
      this.changePasswordUseCase,
      this.regenerateBackupCodesUseCase,
      this.resetupTotpUseCase,
      this.getBackupCodesUseCase
    );
  }

  public static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }
}

export const authContainer = AuthContainer.getInstance();

