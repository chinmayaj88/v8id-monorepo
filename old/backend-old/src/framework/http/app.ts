import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalRateLimiter } from '../../presentation/middleware/rate-limit.middleware.js';
import { ResponseUtil } from '../../presentation/utils/response.util.js';

export async function createApp(): Promise<Express> {
  const app = express();

  const trustProxy = process.env.TRUST_PROXY;
  const isProduction = process.env.NODE_ENV === 'production';

  if (trustProxy === 'true') {
    app.set('trust proxy', true);
  } else if (!trustProxy && isProduction) {
    // In production, default to trusting 1 level of proxy (Nginx)
    app.set('trust proxy', 1);
  } else if (!isNaN(Number(trustProxy))) {
    app.set('trust proxy', Number(trustProxy));
  } else {
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

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN;

  if (isProduction && !corsOrigin) {
    console.warn(
      '⚠️  WARNING: CORS_ORIGIN not set in production. Defaulting to no CORS (most secure).'
    );
  }

  app.use(
    cors({
      origin: corsOrigin || (isProduction ? false : '*'), // Allow all in dev, restrict in prod
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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
