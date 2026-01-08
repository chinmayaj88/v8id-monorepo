import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { AccountLockoutService } from '../../infrastructure/services/account-lockout.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  authRateLimiter,
  totpRateLimiter,
  refreshRateLimiter,
} from '../middleware/rate-limit.middleware';

const router: IRouter = Router();

// Initialize repositories
const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const auditLogRepository = new AuditLogRepository();

// Initialize services
const auditLogService = new AuditLogService(auditLogRepository);
const accountLockoutService = new AccountLockoutService(auditLogRepository);

// Initialize use cases
const verifyCredentialsUseCase = new VerifyCredentialsUseCase(
  userRepository,
  auditLogService,
  accountLockoutService
);
const verifyTotpLoginUseCase = new VerifyTotpLoginUseCase(userRepository, deviceSessionRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(
  deviceSessionRepository,
  userRepository,
  auditLogService
);
const logoutUseCase = new LogoutUseCase(deviceSessionRepository, auditLogService);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, auditLogService);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository, auditLogService);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, auditLogService);

// Initialize controller
const authController = new AuthController(
  verifyCredentialsUseCase,
  verifyTotpLoginUseCase,
  refreshTokenUseCase,
  logoutUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  changePasswordUseCase
);

// Routes
router.post('/verify-credentials', authRateLimiter, (req, res) =>
  authController.verifyCredentials(req, res)
);
router.post('/verify-totp', totpRateLimiter, (req, res) => authController.verifyTotp(req, res));
router.post('/refresh', refreshRateLimiter, (req, res) => authController.refresh(req, res));
router.post('/logout', authMiddleware(userRepository, deviceSessionRepository), (req, res) =>
  authController.logout(req, res)
);

// Password management routes
router.post('/forgot-password', authRateLimiter, (req, res) =>
  authController.forgotPassword(req, res)
);
router.post('/reset-password', authRateLimiter, (req, res) =>
  authController.resetPassword(req, res)
);
router.post('/change-password', authMiddleware(userRepository, deviceSessionRepository), (req, res) =>
  authController.changePassword(req, res)
);

export default router;
