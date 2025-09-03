import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const alertsSchema = sqliteTable('alerts', {
  ...createSyncableEntity(),
  type: text('type', { enum: ['budget_warning', 'recurring_due', 'savings_deadline', 'custom'] }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  isDismissed: integer('is_dismissed', { mode: 'boolean' }).default(false),
  dueDate: text('due_date'),
  relatedId: integer('related_id'),
  relatedType: text('related_type'),
});

type TAlert = TBaseEntity & {
  type: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isDismissed: boolean;
  dueDate: string | null;
  relatedId: number | null;
  relatedType: string | null;
  synced: boolean;
};

type TAlertInsert = Omit<TAlert, 'id' | 'createdAt' | 'updatedAt'>;

type TAlertSelect = TAlert;

export { TAlert, TAlertInsert, TAlertSelect };
