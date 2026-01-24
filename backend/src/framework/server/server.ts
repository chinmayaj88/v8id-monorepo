import { createApp } from '../http/app.js';
import type { Express } from 'express';

/**
 * Server class responsible for starting the Express application
 * Single Responsibility: Only handles server lifecycle
 */
export class Server {
  private app: Express | null = null;

  async start(port: number = 4000): Promise<void> {
    try {
      // Create Express app
      this.app = createApp();

      // Start server on all network interfaces
      this.app.listen(port, '0.0.0.0', () => {
        console.log(`✅ Server running on http://localhost:${port}`);
        console.log(`📍 Health check: http://localhost:${port}/health`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  getApp(): Express | null {
    return this.app;
  }
}
