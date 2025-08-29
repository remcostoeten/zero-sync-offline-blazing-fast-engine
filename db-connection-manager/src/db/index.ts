import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { connections } from "./schema";

// Main database connection (for storing connection metadata)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema: { connections } });

// Function to create a connection to any PostgreSQL database
export async function createDatabaseConnection(connectionString: string) {
  try {
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Test the connection with SELECT 1
    const result = await db.execute(sql`SELECT 1 as test`);
    return { success: true, db, client };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Function to get database schema information
export async function getDatabaseSchema(db: any) {
  try {
    const tables = await db.execute(sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    return { success: true, tables };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Function to execute custom queries
export async function executeQuery(db: any, query: string) {
  try {
    const result = await db.execute(sql.raw(query));
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
