import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Add user ID for user-specific connections
  name: text('name').notNull(),
  type: text('type', { enum: ['postgres', 'sqlite', 'libsql'] }).notNull(),
  url: text('url'),
  filePath: text('file_path'),
  token: text('token'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
});

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
