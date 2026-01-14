import 'dotenv/config';
import { Server } from './framework/server/server.js';
import { validateEnvironment } from './infrastructure/config/env-validator.js';

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  console.log('🚀 v8id-cloud Backend starting...');
  
  // Validate critical environment variables
  try {
    validateEnvironment();
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Environment validation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  const server = new Server();
  await server.start(PORT);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

