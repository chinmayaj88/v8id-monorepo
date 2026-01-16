import { Server } from './framework/server/server.js';
import { ConfigServiceFactory } from './infrastructure/config/config-service.factory.js';
import { validateEnvironment } from './infrastructure/config/env-validator.js';

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  console.log('🚀 v8id-cloud Backend starting...');

  // Initialize configuration service (loads from .env or OCI Vault based on environment )
  const configService = await ConfigServiceFactory.create();
  console.log(`📦 Running in ${configService.getEnvironment()} mode`);

  // Validate critical environment variables
  try {
    validateEnvironment(configService);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error(
      '❌ Environment validation failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }

  const server = new Server();
  await server.start(PORT);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
