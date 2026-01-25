import { config } from 'dotenv';

// Initialize environment variables with override enabled
// This must be imported before any other module that relies on env vars
config({ override: true });

console.log('✅ Environment variables initialized with override (init-env)');
