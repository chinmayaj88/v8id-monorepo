import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { RegenerateBackupCodesUseCase } from '../../application/use-cases/regenerate-backup-codes.use-case';
import { ResetupTotpUseCase } from '../../application/use-cases/resetup-totp.use-case';
import { TotpBackupCodeRepository } from '../../infrastructure/repositories';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { AccountLockoutService } from '../../infrastructure/services/account-lockout.service';
import { EmailServiceFactory } from '../../infrastructure/services/email.service.factory';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { TotpService } from '../../infrastructure/services/totp.service';
import { IEmailService } from '../../application/interfaces/email-service.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  authRateLimiter,
  totpRateLimiter,
  refreshRateLimiter,
} from '../middleware/rate-limit.middleware';
import {
  validateBody,
  verifyCredentialsSchema,
  verifyTotpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  regenerateBackupCodesSchema,
  resetupTotpSchema,
  logoutSchema,
} from '../validators';

const router: IRouter = Router();

// Initialize services
const passwordService = new PasswordService(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

// Initialize repositories
const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const auditLogRepository = new AuditLogRepository();
const totpBackupCodeRepository = new TotpBackupCodeRepository(passwordService);
const jwtService = new JwtService();
const totpService = new TotpService();
const auditLogService = new AuditLogService(auditLogRepository);
const accountLockoutService = new AccountLockoutService(auditLogRepository);
const emailService: IEmailService = EmailServiceFactory.create(); // Clean Architecture: Factory creates implementation

// Initialize use cases
const verifyCredentialsUseCase = new VerifyCredentialsUseCase(
  userRepository,
  passwordService,
  jwtService,
  auditLogService,
  accountLockoutService
);
const verifyTotpLoginUseCase = new VerifyTotpLoginUseCase(
  userRepository,
  deviceSessionRepository,
  emailService,
  totpService,
  jwtService
);
const refreshTokenUseCase = new RefreshTokenUseCase(
  deviceSessionRepository,
  userRepository,
  jwtService,
  auditLogService
);
const logoutUseCase = new LogoutUseCase(deviceSessionRepository, auditLogService);
const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepository,
  auditLogService,
  emailService
);
const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  passwordService,
  auditLogService
);
const changePasswordUseCase = new ChangePasswordUseCase(
  userRepository,
  passwordService,
  totpService,
  auditLogService,
  emailService
);
const regenerateBackupCodesUseCase = new RegenerateBackupCodesUseCase(
  userRepository,
  totpBackupCodeRepository,
  passwordService,
  totpService,
  auditLogService
);
const resetupTotpUseCase = new ResetupTotpUseCase(
  userRepository,
  totpBackupCodeRepository,
  passwordService,
  totpService,
  auditLogService
);

// Initialize controller
const authController = new AuthController(
  verifyCredentialsUseCase,
  verifyTotpLoginUseCase,
  refreshTokenUseCase,
  logoutUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  regenerateBackupCodesUseCase,
  resetupTotpUseCase
);

// Routes
router.post(
  '/verify-credentials',
  authRateLimiter,
  validateBody(verifyCredentialsSchema),
  (req, res) => authController.verifyCredentials(req, res)
);
router.post(
  '/verify-totp',
  totpRateLimiter,
  validateBody(verifyTotpSchema),
  (req, res) => authController.verifyTotp(req, res)
);
router.post(
  '/refresh',
  refreshRateLimiter,
  validateBody(refreshTokenSchema),
  (req, res) => authController.refresh(req, res)
);
router.post(
  '/logout',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  validateBody(logoutSchema),
  (req, res) => authController.logout(req, res)
);

// Password management routes
router.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  (req, res) => authController.forgotPassword(req, res)
);
router.post(
  '/reset-password',
  authRateLimiter,
  validateBody(resetPasswordSchema),
  (req, res) => authController.resetPassword(req, res)
);
router.post(
  '/change-password',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  validateBody(changePasswordSchema),
  (req, res) => authController.changePassword(req, res)
);

// TOTP management routes
router.post(
  '/regenerate-backup-codes',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  totpRateLimiter,
  validateBody(regenerateBackupCodesSchema),
  (req, res) => authController.regenerateBackupCodes(req, res)
);
router.post(
  '/resetup-totp',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  authRateLimiter,
  validateBody(resetupTotpSchema),
  (req, res) => authController.resetupTotp(req, res)
);

export default router;
