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

  // TEMPORARY: One-time registration route for admin setup
  // WILL BE REMOVED AFTER USE
  app.post('/api/temp-register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { prisma } = await import('../../infrastructure/database/prisma-client.js');
      const { PasswordService } = await import('../../infrastructure/services/password.service.js');
      const passwordService = new PasswordService();

      const hashedPassword = await passwordService.hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role: role || 'USER',
          emailVerified: true,
          isActive: true,
          storageQuota: BigInt(10737418240), // 10GB
          storageUsed: BigInt(0),
          totpVerified: false,
        },
      });

      return res.status(201).json({
        message: 'User created successfully',
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
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
