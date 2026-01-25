import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authContainer, sharedContainer } from '../../infrastructure/di/index.js';
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
const authController = authContainer.authController;
const userRepository = sharedContainer.userRepository;
const deviceSessionRepository = sharedContainer.deviceSessionRepository;
const jwtService = sharedContainer.jwtService;

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
