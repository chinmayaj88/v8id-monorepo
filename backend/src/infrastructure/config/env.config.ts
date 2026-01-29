import { z } from 'zod';

/**
 * Environment configuration schema with validation
 * Single Responsibility: Only handles environment variable parsing and validation
 */
const envSchema = z.object({
  port: z.coerce.number().default(4000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  corsOrigin: z.string().min(1).default('http://localhost:3000,http://localhost:5173'),
  trustProxy: z.string().default('false'),
});

type EnvConfig = z.infer<typeof envSchema>;

function loadEnvConfig(): EnvConfig {
  const result = envSchema.safeParse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    trustProxy: process.env.TRUST_PROXY,
  });

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten());
    process.exit(1);
  }

  return result.data;
}

export const envConfig = loadEnvConfig();
