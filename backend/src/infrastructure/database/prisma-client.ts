import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../generated/prisma/index.js';

// Export all generated types, enums, and utility classes
export * from '../../../generated/prisma/index.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

let prismaInstance: PrismaClient;

/**
 * Enterprise Singleton for Prisma Client
 * Ensures that environment variables are fully loaded before the client is created.
 */
function getPrismaClient(): PrismaClient {
  if (prismaInstance) return prismaInstance;
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const env = process.env;
  const databaseUrl = env.DATABASE_URL;
  const isProduction = env.NODE_ENV === 'production';

  let adapterOptions: any;
  if (databaseUrl) {
    try {
      // Must replace 'mysql://' with 'http://' to satisfy the strictly compliant URL parser if needed
      const protocolFixedUrl = databaseUrl.replace(/^mysql:\/\//, 'http://');
      const url = new URL(protocolFixedUrl);

      adapterOptions = {
        host: url.hostname || 'localhost',
        port: url.port ? parseInt(url.port, 10) : 3306,
        user: url.username || 'root',
        // CRITICAL: Decode the password.
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ''),
      };
    } catch (err) {
      if (!isProduction) {
        console.error('❌ Failed to parse DATABASE_URL:', err);
      }
      adapterOptions = { url: databaseUrl };
    }
  } else {
    adapterOptions = {
      host: env.DATABASE_HOST || 'localhost',
      port: env.DATABASE_PORT ? parseInt(env.DATABASE_PORT, 10) : 3306,
      user: env.DATABASE_USER || 'root',
      password: env.DATABASE_PASSWORD ? decodeURIComponent(env.DATABASE_PASSWORD) : '',
      database: env.DATABASE_NAME || '',
    };
  }

  const useSsl = isProduction || (databaseUrl?.includes('ssl') ?? false);

  const adapter = new PrismaMariaDb({
    ...adapterOptions,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
    ssl: useSsl
      ? {
          rejectUnauthorized: false, // HeatWave requires SSL
        }
      : undefined,
  });

  const client = new PrismaClient({
    adapter,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  prismaInstance = client;
  return client;
}

// Export the prisma instance via a Proxy or direct export
export const prisma: PrismaClient = new Proxy({} as any, {
  get: (_target, prop, receiver) => {
    const instance = getPrismaClient();
    return Reflect.get(instance, prop, receiver);
  },
});
