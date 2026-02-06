import { Router } from 'express';
import { filesContainer } from '../../infrastructure/di/index.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { strictMutationRateLimiter } from '../middleware/rate-limit.middleware.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

const router: Router = Router();

router.use(authenticate);

// Use controller from DI container
// Shared files
router.get('/shared', (req, res) => filesContainer.shareController.listSharedWithMe(req, res));
router.delete('/shares/:id', strictMutationRateLimiter, (req, res) =>
  filesContainer.shareController.revokeShare(req, res)
);

// Analytics
router.get('/analytics', (req, res) => filesContainer.fileController.getAnalytics(req, res));
router.get('/albums', (req, res) => filesContainer.fileController.getAlbums(req, res));

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
router.get('/:id/thumbnail', (req, res) => filesContainer.fileController.getThumbnail(req, res));
router.delete('/:id', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.delete(req, res)
);
router.post('/:id/restore', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.restore(req, res)
);

// Bulk/Batch Operations
router.post('/move', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.moveItems(req, res)
);
router.post('/copy', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.copyItems(req, res)
);
router.delete('/', strictMutationRateLimiter, (req, res) =>
  filesContainer.fileController.bulkDelete(req, res)
);

export default router;
