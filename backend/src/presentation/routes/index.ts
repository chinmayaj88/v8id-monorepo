/**
 * Route Definitions
 * 
 * Defines all API routes and maps them to controllers.
 */

import { Router, type IRouter } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import fileRoutes from './file.routes';

const router: IRouter = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);

export default router;
