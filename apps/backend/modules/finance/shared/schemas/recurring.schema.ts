import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';
import { categoriesSchema } from './categories.schema';

export const recurringTransactionsSchema = sqliteTable('recurring_transactions', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  recurrenceRule: text('recurrence_rule', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
  nextDueDate: text('next_due_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
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
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  recurrenceRule: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
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
