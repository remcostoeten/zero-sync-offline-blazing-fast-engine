import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';
import { categoriesSchema } from './categories.schema';

export const budgetsSchema = sqliteTable('budgets', {
  ...createSyncableEntity(),
  userId: text('user_id').notNull(), // Add user ID for user-specific budgets
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  name: text('name').notNull(),
  description: text('description'),
  amount: real('amount').notNull(),
  spent: real('spent').default(0).notNull(),
  period: text('period', { enum: ['weekly', 'monthly', 'quarterly', 'yearly'] }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  alertThreshold: real('alert_threshold').default(0.8),
  rollover: integer('rollover', { mode: 'boolean' }).default(false).notNull(),
  carryoverAmount: real('carryover_amount').default(0),
  color: text('color').default('#3B82F6'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  autoRenew: integer('auto_renew', { mode: 'boolean' }).default(true).notNull(),
  resetDay: integer('reset_day').default(1)
});

export const budgetsRelations = relations(budgetsSchema, ({ one }) => ({
  category: one(categoriesSchema, {
    fields: [budgetsSchema.categoryId],
    references: [categoriesSchema.id],
  }),
}));

type TBudget = TBaseEntity & {
  categoryId: number;
  name: string;
  description?: string | null;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  alertThreshold?: number | null;
  rollover: boolean;
  carryoverAmount?: number | null;
  color?: string | null;
  priority: 'low' | 'medium' | 'high';
  autoRenew: boolean;
  resetDay?: number | null;
  synced: boolean;
};

type TBudgetInsert = Omit<TBudget, 'id' | 'createdAt' | 'updatedAt'>;

type TBudgetSelect = TBudget;

type TBudgetWithCategory = TBudget & {
  category: {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
  };
};

export type { TBudget, TBudgetInsert, TBudgetSelect, TBudgetWithCategory };
