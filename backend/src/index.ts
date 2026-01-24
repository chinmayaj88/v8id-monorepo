import 'dotenv/config';
import { Server } from './framework/server/server.js';
import { envConfig } from './infrastructure/config/env.config.js';

async function main(): Promise<void> {
  console.log('🚀 v8id-cloud Backend v2 starting...');
  console.log(`📦 Running in ${envConfig.nodeEnv} mode`);

  const server = new Server();
  await server.start(envConfig.port);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
