import { Router } from 'express';
import { vaultContainer, sharedContainer } from '../../infrastructure/di/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { strictMutationRateLimiter } from '../middleware/rate-limit.middleware.js';

const router: Router = Router();

const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

router.use(authenticate);

// List all secrets (metadata only)
router.get('/', (req, res) => vaultContainer.vaultController.listSecrets(req, res));

// Search secrets
router.get('/search', (req, res) => vaultContainer.vaultController.searchSecrets(req, res));

// Get specific secret (includes decrypted password)
router.get('/:id', (req, res) => vaultContainer.vaultController.getSecret(req, res));

// Add new secret
router.post('/', strictMutationRateLimiter, (req, res) =>
  vaultContainer.vaultController.addSecret(req, res)
);

// Delete secret
router.delete('/:id', strictMutationRateLimiter, (req, res) =>
  vaultContainer.vaultController.deleteSecret(req, res)
);

export default router;
