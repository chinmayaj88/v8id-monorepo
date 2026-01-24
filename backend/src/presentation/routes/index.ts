import { Router } from 'express';

/**
 * API Routes aggregator
 * Open/Closed Principle: Easy to add new route modules
 */
const router = Router();

// Future route modules will be added here
// Example:
// import authRoutes from './auth.routes.js';
// import userRoutes from './user.routes.js';
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);

// API info route
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      message: 'v8id-cloud API v2',
      version: '2.0.0',
      endpoints: {
        health: 'GET /health',
        api: 'GET /api',
      },
    },
  });
});

export default router;
