import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Parse DATABASE_URL or use individual environment variables
function getDatabaseConfig() {
  const env = process.env;

  // 1. If DATABASE_URL is present, use it as the source of truth
  if (env.DATABASE_URL) {
    try {
      const url = new URL(env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));

      // The URL parser automatically decodes components like the password
      return {
        host: url.hostname || 'localhost',
        port: url.port ? parseInt(url.port, 10) : 3306,
        user: url.username || 'root',
        password: url.password || '',
        database: url.pathname.replace(/^\//, '') || '',
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse DATABASE_URL, falling back to individual variables');
    }
  }

  // 2. Fallback to individual variables (Standard Enterprise Pattern)
  // We decode the password here too, just in case it was stored encoded in the Vault
  return {
    host: env.DATABASE_HOST || 'localhost',
    port: env.DATABASE_PORT ? parseInt(env.DATABASE_PORT, 10) : 3306,
    user: env.DATABASE_USER || 'root',
    password: env.DATABASE_PASSWORD ? decodeURIComponent(env.DATABASE_PASSWORD) : '',
    database: env.DATABASE_NAME || '',
  };
}

const dbConfig = getDatabaseConfig();
const adapter = new PrismaMariaDb({
  ...dbConfig,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
  ssl: {
    rejectUnauthorized: false, // HeatWave requires SSL, but we bypass CA check for internal VCN traffic
  },
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
