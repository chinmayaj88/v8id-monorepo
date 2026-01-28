import { Router } from 'express';
import multer from 'multer';
import { filesContainer } from '../../infrastructure/di/index.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 104857600, // 100MB default
  },
});

const router: Router = Router();

router.use(authenticate);

// Use controller from DI container
// Shared files
router.get('/shared', (req, res) => filesContainer.shareController.listSharedWithMe(req, res));

// Analytics
router.get('/analytics', (req, res) => filesContainer.fileController.getAnalytics(req, res));

router.post('/upload', upload.single('file'), (req, res) =>
  filesContainer.fileController.upload(req, res)
);

// File operations
router.post('/:id/share', (req, res) => filesContainer.shareController.createShare(req, res));
router.post('/:id/link', (req, res) => filesContainer.fileController.generateLink(req, res));
router.delete('/:id', (req, res) => filesContainer.fileController.delete(req, res));
router.post('/:id/restore', (req, res) => filesContainer.fileController.restore(req, res));

export default router;
