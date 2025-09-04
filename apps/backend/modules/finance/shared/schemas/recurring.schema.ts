import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';
import { categoriesSchema } from './categories.schema';

export const recurringTransactionsSchema = sqliteTable('recurring_transactions', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  description: text('description'),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  
  // Recurring pattern - keeping it simple with a single recurrenceRule for now
  recurrenceRule: text('recurrence_rule', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
  nextDueDate: text('next_due_date').notNull(),
  
  // Additional scheduling fields
  frequency: text('frequency', { enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] }),
  interval: integer('interval').default(1),
  dayOfWeek: integer('day_of_week'), // 0=Sunday, for weekly
  dayOfMonth: integer('day_of_month'), // For monthly/quarterly/yearly
  monthOfYear: integer('month_of_year'), // For yearly
  
  // Date range
  startDate: text('start_date'),
  endDate: text('end_date'),
  maxOccurrences: integer('max_occurrences'),
  
  // Status and automation
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  autoGenerate: integer('auto_generate', { mode: 'boolean' }).default(true),
  notifyOnGeneration: integer('notify_on_generation', { mode: 'boolean' }).default(false),
  
  // Transaction details
  payee: text('payee'),
  reference: text('reference'),
  tags: text('tags'), // JSON string of array
  
  // Generation tracking
  lastGenerated: text('last_generated'),
  generatedCount: integer('generated_count').default(0),
  
  // Notes
  note: text('note'),
});

export const recurringTransactionsRelations = relations(recurringTransactionsSchema, ({ one }) => ({
  category: one(categoriesSchema, {
    fields: [recurringTransactionsSchema.categoryId],
    references: [categoriesSchema.id],
  }),
}));

type TRecurringTransaction = TBaseEntity & {
  name: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  recurrenceRule: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  
  // Additional scheduling fields
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  interval?: number;
  dayOfWeek?: number; // 0=Sunday, for weekly
  dayOfMonth?: number; // For monthly/quarterly/yearly
  monthOfYear?: number; // For yearly
  
  // Date range
  startDate?: string;
  endDate?: string;
  maxOccurrences?: number;
  
  // Status and automation
  isActive: boolean;
  autoGenerate?: boolean;
  notifyOnGeneration?: boolean;
  
  // Transaction details
  payee?: string;
  reference?: string;
  tags?: string; // JSON string
  
  // Generation tracking
  lastGenerated?: string;
  generatedCount?: number;
  
  // Notes
  note: string | null;
  synced: boolean;
};

type TRecurringTransactionInsert = Omit<TRecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>;

type TRecurringTransactionSelect = TRecurringTransaction;

type TRecurringTransactionWithCategory = TRecurringTransaction & {
  category: {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
  };
};

export type { 
  TRecurringTransaction, 
  TRecurringTransactionInsert, 
  TRecurringTransactionSelect,
  TRecurringTransactionWithCategory
};
