import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// Shared database connection for frontend
export function createDb() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  return drizzle(client);
}

// Singleton pattern for database instance
let dbInstance: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}
