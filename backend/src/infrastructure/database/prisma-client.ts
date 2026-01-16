import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Parse DATABASE_URL or use individual environment variables
// Database configuration with smart SSL handling
const env = process.env;
const databaseUrl = env.DATABASE_URL;
const isProduction = env.NODE_ENV === 'production';

let adapterOptions: any;

if (databaseUrl) {
  // Use the connection string directly - this is the safest way for special passwords
  // and is exactly how the successful migrations worked.
  adapterOptions = { url: databaseUrl };
} else {
  // Fallback to individual variables for local development
  adapterOptions = {
    host: env.DATABASE_HOST || 'localhost',
    port: env.DATABASE_PORT ? parseInt(env.DATABASE_PORT, 10) : 3306,
    user: env.DATABASE_USER || 'root',
    password: env.DATABASE_PASSWORD ? decodeURIComponent(env.DATABASE_PASSWORD) : '',
    database: env.DATABASE_NAME || '',
  };
}

// HeatWave requires SSL in production or when specified in URL
const useSsl = isProduction || (databaseUrl?.includes('ssl') ?? false);

const adapter = new PrismaMariaDb({
  ...adapterOptions,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
  ssl: useSsl
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
