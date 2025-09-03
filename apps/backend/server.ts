import { serve } from '@hono/node-server';
import app from './app';

const PORT = process.env.PORT || 4000;

console.log('🚀 Starting Hono Finance API...');
console.log(`📡 Server running on port ${PORT}`);
console.log(`🌐 Health check: http://localhost:${PORT}/health`);
console.log(`💰 Finance API: http://localhost:${PORT}/api/finance`);
console.log('─'.repeat(50));

serve({
  fetch: app.fetch,
  port: PORT as number
});
