import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { envConfig } from '../../infrastructure/config/env.config.js';
import { ResponseUtil } from '../../presentation/utils/response.util.js';
import { errorMiddleware } from '../../presentation/middleware/error.middleware.js';
import apiRoutes from '../../presentation/routes/index.js';

/**
 * Creates and configures the Express application
 * Open/Closed Principle: Easy to extend with new middleware/routes
 */
export function createApp(): Express {
  const app = express();

  // Configure trust proxy
  configureTrustProxy(app);

  // Security middleware
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
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: envConfig.corsOrigin === '*' ? '*' : envConfig.corsOrigin.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check route
  app.get('/health', (_req, res) => {
    ResponseUtil.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  });

  // Main route with success message
  app.get('/', (_req, res) => {
    ResponseUtil.success(res, {
      message: 'Welcome to v8id-cloud API v2',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api', apiRoutes);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}

function configureTrustProxy(app: Express): void {
  const { trustProxy } = envConfig;
  const isProduction = envConfig.nodeEnv === 'production';

  if (trustProxy === 'true') {
    app.set('trust proxy', true);
  } else if (trustProxy === 'false' && isProduction) {
    // In production, default to trusting 1 level of proxy (Nginx)
    app.set('trust proxy', 1);
  } else if (!isNaN(Number(trustProxy))) {
    app.set('trust proxy', Number(trustProxy));
  } else {
    app.set('trust proxy', false);
  }
}
