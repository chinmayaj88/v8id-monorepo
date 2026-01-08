import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalRateLimiter } from '../../presentation/middleware/rate-limit.middleware';

export async function createApp(): Promise<Express> {
  const app = express();

  // Trust proxy for accurate IP address extraction (for reverse proxy/load balancer)
  // This allows req.ip to work correctly with X-Forwarded-For header
  app.set('trust proxy', true);

  // Security headers (Helmet.js)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding if needed
    })
  );

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    })
  );

  // Request size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Apply general rate limiting to all API routes
  app.use('/api', generalRateLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Welcome to void API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  const apiRoutes = (await import('../../presentation/routes/index.js')).default;
  app.use('/api', apiRoutes);

  return app;
}
