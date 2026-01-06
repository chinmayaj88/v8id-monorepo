/**
 * Authentication Routes
 * 
 * Defines authentication-related API routes.
 */

import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { VerifyCredentialsUseCase } from '../../application/use-cases/verify-credentials.use-case';
import { VerifyTotpLoginUseCase } from '../../application/use-cases/verify-totp-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { authMiddleware } from '../middleware/auth.middleware';

const router: IRouter = Router();

// Initialize repositories
const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();

// Initialize use cases
const loginUseCase = new LoginUseCase(userRepository, deviceSessionRepository);
const verifyCredentialsUseCase = new VerifyCredentialsUseCase(userRepository);
const verifyTotpLoginUseCase = new VerifyTotpLoginUseCase(userRepository, deviceSessionRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(deviceSessionRepository);
const logoutUseCase = new LogoutUseCase(deviceSessionRepository);

// Initialize controller
const authController = new AuthController(
  loginUseCase,
  verifyCredentialsUseCase,
  verifyTotpLoginUseCase,
  refreshTokenUseCase,
  logoutUseCase
);

// Routes
// Two-step login (recommended)
router.post('/verify-credentials', (req, res) => authController.verifyCredentials(req, res));
router.post('/verify-totp', (req, res) => authController.verifyTotp(req, res));

// Single-step login (backward compatibility - still works)
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', authMiddleware(userRepository, deviceSessionRepository), (req, res) => authController.logout(req, res));

export default router;

