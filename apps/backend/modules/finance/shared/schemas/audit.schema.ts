import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { TBaseEntity } from '../types';
import { createTimestamps } from '../db/schema-helpers';

export const auditLogSchema = sqliteTable('audit_log', {
  id: integer('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: integer('record_id').notNull(),
  action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  userId: integer('user_id'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  synced: integer('synced', { mode: 'boolean' }).default(false),
});

type TAuditLog = {
  id: number;
  tableName: string;
  recordId: number;
  action: 'create' | 'update' | 'delete';
  oldValues: string | null;
  newValues: string | null;
  userId: number | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  synced: boolean;
};

type TAuditLogInsert = Omit<TAuditLog, 'id' | 'createdAt'>;

type TAuditLogSelect = TAuditLog;

export type { TAuditLog, TAuditLogInsert, TAuditLogSelect };
