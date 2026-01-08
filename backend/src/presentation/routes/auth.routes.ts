import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
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

// Initialize use cases
const verifyCredentialsUseCase = new VerifyCredentialsUseCase(userRepository);
const verifyTotpLoginUseCase = new VerifyTotpLoginUseCase(userRepository, deviceSessionRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(
  deviceSessionRepository,
  userRepository,
  auditLogService
);
const logoutUseCase = new LogoutUseCase(deviceSessionRepository, auditLogService);

// Initialize controller
const authController = new AuthController(
  verifyCredentialsUseCase,
  verifyTotpLoginUseCase,
  refreshTokenUseCase,
  logoutUseCase
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

export default router;
