import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalRateLimiter } from '../../presentation/middleware/rate-limit.middleware';
import { ResponseUtil } from '../../presentation/utils/response.util';

export async function createApp(): Promise<Express> {
  const app = express();

  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy === 'true') {
    console.warn(
      '⚠️  WARNING: TRUST_PROXY=true is insecure and allows IP spoofing. Only use in trusted networks.'
    );
    app.set('trust proxy', true);
  } else if (trustProxy === 'false' || !trustProxy) {
    app.set('trust proxy', false);
  } else if (!isNaN(Number(trustProxy))) {
    app.set('trust proxy', Number(trustProxy));
  } else {
    console.warn(`⚠️  Invalid TRUST_PROXY value: ${trustProxy}. Defaulting to false for security.`);
    app.set('trust proxy', false);
  }

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
      origin: process.env.CORS_ORIGIN || '*', // Allow all origins for development (emulator, physical devices)
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
    ResponseUtil.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (_req, res) => {
    ResponseUtil.success(res, {
      message: 'Welcome to v8id-cloud API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  const apiRoutes = (await import('../../presentation/routes/index.js')).default;
  app.use('/api', apiRoutes);

  return app;
}
