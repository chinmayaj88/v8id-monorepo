/**
 * Route Definitions
 */

import { Router, type IRouter } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import folderRoutes from './folder.routes.js';
import fileRoutes from './file.routes.js';
import searchRoutes from './search.routes.js';
import syncRoutes from './sync.routes.js';
import vaultRoutes from './vault.routes.js';

import trashRoutes from './trash.routes.js';
import shareRoutes from './share.routes.js';

const router: IRouter = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/folders', folderRoutes);
router.use('/files', fileRoutes);
router.use('/trash', trashRoutes);
router.use('/search', searchRoutes);
router.use('/sync', syncRoutes);
router.use('/vault', vaultRoutes);
router.use('/share', shareRoutes); // Public share access

export default router;
