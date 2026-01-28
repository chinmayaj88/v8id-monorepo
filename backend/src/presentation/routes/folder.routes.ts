import { Router } from 'express';
import { filesContainer } from '../../infrastructure/di/index.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

const router: Router = Router();

router.use(authenticate);

// Use controller from DI container
router.post('/', (req, res) => filesContainer.folderController.create(req, res));
router.get('/', (req, res) => filesContainer.folderController.list(req, res));
router.delete('/:id', (req, res) => filesContainer.folderController.delete(req, res));
router.post('/:id/restore', (req, res) => filesContainer.folderController.restore(req, res));
router.post('/:id/share', (req, res) => filesContainer.shareController.createFolderShare(req, res));

export default router;
