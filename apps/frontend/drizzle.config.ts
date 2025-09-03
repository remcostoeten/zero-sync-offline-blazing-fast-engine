import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/database/schemas.ts',
  out: './drizzle',
  dbCredentials: {
    url: './dev.db',
  },
});
