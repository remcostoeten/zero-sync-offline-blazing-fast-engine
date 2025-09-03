import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';
import { categoriesSchema } from './categories.schema';

export const budgetsSchema = sqliteTable('budgets', {
  ...createSyncableEntity(),
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  amount: real('amount').notNull(),
  period: text('period', { enum: ['monthly', 'yearly'] }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

export const budgetsRelations = relations(budgetsSchema, ({ one }) => ({
  category: one(categoriesSchema, {
    fields: [budgetsSchema.categoryId],
    references: [categoriesSchema.id],
  }),
}));

type TBudget = TBaseEntity & {
  categoryId: number;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string | null;
  isActive: boolean;
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
