import { Router } from 'express';
import { filesContainer } from '../../infrastructure/di/index.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

const router: Router = Router();

router.use(authenticate);

router.get('/', (req, res) => filesContainer.trashController.list(req, res));

export default router;
