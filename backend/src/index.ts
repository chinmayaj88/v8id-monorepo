import 'dotenv/config';
import { Server } from './framework/server/server.js';
import { envConfig } from './infrastructure/config/env.config.js';
import { ConfigServiceFactory } from './infrastructure/config/config-service.factory.js';
import { validateEnvironment } from './infrastructure/config/env-validator.js';

async function main(): Promise<void> {
  console.log('🚀 v8id-cloud Backend v2 starting...');

  // Initialize configuration service
  const configService = await ConfigServiceFactory.create();
  console.log(`📦 Running in ${configService.getEnvironment()} mode`);

  // Validate critical environment variables
  try {
    validateEnvironment(configService);
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error(
      '❌ Environment validation failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }

  const server = new Server();
  await server.start(envConfig.port);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
