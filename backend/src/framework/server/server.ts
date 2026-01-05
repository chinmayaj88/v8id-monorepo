import { createApp } from '../http/app.js';
import { prisma } from '../../infrastructure/database/prisma-client.js';

export class Server {
  private app = createApp();

  async start(port: number = 4000): Promise<void> {
    try {
      // Connect to database
      await prisma.$connect();
      console.log('✅ Database connected');

      // Start server
      this.app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

