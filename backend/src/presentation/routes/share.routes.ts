import { Router } from 'express';
import { filesContainer } from '../../infrastructure/di/index.js';

const router: Router = Router();

// Public shared link access
router.get('/:token', (req, res) => filesContainer.shareController.getSharedFile(req, res));

export default router;
