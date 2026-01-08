import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Parse DATABASE_URL or use individual environment variables
function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    try {
      // Parse mysql://user:password@host:port/database
      const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
      return {
        host: process.env.DATABASE_HOST || url.hostname || 'localhost',
        port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : (url.port ? parseInt(url.port, 10) : 3306),
        user: process.env.DATABASE_USER || url.username || 'root',
        password: process.env.DATABASE_PASSWORD || url.password || '',
        database: process.env.DATABASE_NAME || url.pathname.replace(/^\//, '') || '',
      };
    } catch {
      // Fallback to individual env vars if URL parsing fails
    }
  }
  
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || '',
  };
}

const dbConfig = getDatabaseConfig();
const adapter = new PrismaMariaDb({
  ...dbConfig,
  connectionLimit: 5,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

