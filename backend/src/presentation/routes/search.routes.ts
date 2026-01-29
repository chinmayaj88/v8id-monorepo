import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sharedContainer } from '../../infrastructure/di/index.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

import { filesContainer } from '../../infrastructure/di/files/files.container.js';

// Use controller from DI container
const { searchController } = filesContainer;

const router: Router = Router();

router.use(authenticate);

router.get('/', (req, res) => searchController.search(req, res));

export default router;
