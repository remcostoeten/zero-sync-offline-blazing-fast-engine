import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

function createDbClient() {
  return createClient({
    url: 'file:finance.db',
    syncUrl: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  });
}

function createDb() {
  const client = createDbClient();
  return drizzle(client);
}

export { createDbClient, createDb };
