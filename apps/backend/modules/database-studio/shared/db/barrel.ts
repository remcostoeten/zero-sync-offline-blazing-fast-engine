import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

// Create LibSQL client for the database studio metadata
const client = createClient({
  url: process.env.DATABASE_STUDIO_DB_URL || 'file:./database-studio.db',
  authToken: process.env.DATABASE_STUDIO_DB_TOKEN
});

// Export the drizzle instance
export const db = drizzle(client);

// Export the raw client for direct operations if needed
export { client };


