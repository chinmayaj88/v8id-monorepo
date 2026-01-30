import { Router } from 'express';

import { filesContainer } from '../../infrastructure/di/index.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { strictMutationRateLimiter } from '../middleware/rate-limit.middleware.js';
// Removed unused schema imports

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

// Multer setup removed as we use JSON-only initiation for OCI Direct Upload

const router: Router = Router();

router.use(authenticate);

// Use controller from DI container
// Shared files
router.get('/shared', (req, res) => filesContainer.shareController.listSharedWithMe(req, res));

// Analytics
router.get('/analytics', (req, res) => filesContainer.fileController.getAnalytics(req, res));

router.post('/upload', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.handleUpload(req, res)
);

// File operations
router.post('/download', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.handleDownload(req, res)
);
router.post('/:id/share', strictMutationRateLimiter, (req, res) =>
  filesContainer.shareController.createShare(req, res)
);
router.delete('/:id', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.delete(req, res)
);
router.post('/:id/restore', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.restore(req, res)
);

export default router;
