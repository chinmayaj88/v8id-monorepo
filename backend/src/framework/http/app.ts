import express, { type Express } from 'express';
import cors from 'cors';

export async function createApp(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    res.json({
      success: true,
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
