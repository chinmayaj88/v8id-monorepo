/**
 * Route Definitions
 *
 * Defines all API routes and maps them to controllers.
 */

import { Router, type IRouter } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import folderRoutes from './folder.routes.js';
import fileRoutes from './file.routes.js';

const router: IRouter = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/folders', folderRoutes);
router.use('/files', fileRoutes);

export default router;
