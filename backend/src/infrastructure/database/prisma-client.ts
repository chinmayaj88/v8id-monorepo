import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | undefined;

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

  console.log('🔄 Initializing Prisma Client...');
  if (databaseUrl) {
    console.log('🔗 Using DATABASE_URL connection');
  } else {
    console.log('🔗 Using individual connection variables');
  }

  let adapterOptions: any;
  if (databaseUrl) {
    adapterOptions = { url: databaseUrl };
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
// Using a Proxy ensures that 'prisma' always refers to the correctly initialized instance
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop, receiver) => {
    const instance = getPrismaClient();
    return Reflect.get(instance, prop, receiver);
  },
});
