import 'dotenv/config';
import { Server } from './framework/server/server.js';

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  console.log('🚀 void Backend starting...');
  
  const server = new Server();
  await server.start(PORT);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

