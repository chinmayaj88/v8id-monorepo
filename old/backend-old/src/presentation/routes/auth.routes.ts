import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case.js';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case.js';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case.js';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case.js';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case.js';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case.js';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case.js';
import { RegenerateBackupCodesUseCase } from '../../application/use-cases/regenerate-backup-codes.use-case.js';
import { ResetupTotpUseCase } from '../../application/use-cases/resetup-totp.use-case.js';
import { GetBackupCodesUseCase } from '../../application/use-cases/get-backup-codes.use-case.js';
import { TotpBackupCodeRepository } from '../../infrastructure/repositories/index.js';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository.js';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository.js';
import { AuditLogService } from '../../infrastructure/services/audit-log.service.js';
import { AccountLockoutService } from '../../infrastructure/services/account-lockout.service.js';
import { EmailServiceFactory } from '../../infrastructure/services/email.service.factory.js';
import { PasswordService } from '../../infrastructure/services/password.service.js';
import { JwtService } from '../../infrastructure/services/jwt.service.js';
import { TotpService } from '../../infrastructure/services/totp.service.js';
import { SuspiciousActivityService } from '../../infrastructure/services/suspicious-activity.service.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { IEmailService } from '../../application/interfaces/email-service.interface.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  authRateLimiter,
  totpRateLimiter,
  refreshRateLimiter,
} from '../middleware/rate-limit.middleware.js';
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
} from '../validators/index.js';

const router: IRouter = Router();

const passwordService = new PasswordService(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const auditLogRepository = new AuditLogRepository();
const totpBackupCodeRepository = new TotpBackupCodeRepository(passwordService);
const jwtService = new JwtService();
const totpService = new TotpService();
const auditLogService = new AuditLogService(auditLogRepository);
const accountLockoutService = new AccountLockoutService(auditLogRepository);
const suspiciousActivityService = new SuspiciousActivityService(auditLogRepository);
const emailService: IEmailService = EmailServiceFactory.create();
const storageService = new TierAwareStorageService();

const verifyCredentialsUseCase = new VerifyCredentialsUseCase(
  userRepository,
  passwordService,
  jwtService,
  auditLogService,
  accountLockoutService,
  suspiciousActivityService,
  emailService
);
const verifyTotpLoginUseCase = new VerifyTotpLoginUseCase(
  userRepository,
  deviceSessionRepository,
  emailService,
  totpService,
  jwtService,
  suspiciousActivityService,
  auditLogService,
  storageService
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
const getBackupCodesUseCase = new GetBackupCodesUseCase(totpBackupCodeRepository);

const authController = new AuthController(
  verifyCredentialsUseCase,
  verifyTotpLoginUseCase,
  refreshTokenUseCase,
  logoutUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  regenerateBackupCodesUseCase,
  resetupTotpUseCase,
  getBackupCodesUseCase
);

router.post(
  '/verify-credentials',
  authRateLimiter,
  validateBody(verifyCredentialsSchema),
  (req, res) => authController.verifyCredentials(req, res)
);
router.post('/verify-totp', totpRateLimiter, validateBody(verifyTotpSchema), (req, res) =>
  authController.verifyTotp(req, res)
);
router.post('/refresh', refreshRateLimiter, validateBody(refreshTokenSchema), (req, res) =>
  authController.refresh(req, res)
);
router.post(
  '/logout',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  validateBody(logoutSchema),
  (req, res) => authController.logout(req, res)
);

// Password management routes
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), (req, res) =>
  authController.forgotPassword(req, res)
);
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), (req, res) =>
  authController.resetPassword(req, res)
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
router.get(
  '/backup-codes',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => authController.getBackupCodes(req, res)
);

export default router;
