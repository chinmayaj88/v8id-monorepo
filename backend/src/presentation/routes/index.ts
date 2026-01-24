/**
 * Route Definitions
 *
 * Defines all API routes and maps them to controllers.
 */

import { Router, type IRouter } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router: IRouter = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
