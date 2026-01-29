import { Router } from 'express';
import { filesContainer } from '../../infrastructure/di/index.js';
import { generalRateLimiter } from '../middleware/rate-limit.middleware.js';

const router: Router = Router();

// Public shared link access - Protected by rate limiter to prevent brute force
router.get('/:token', generalRateLimiter, (req, res) =>
  filesContainer.shareController.getSharedItem(req, res)
);

export default router;
