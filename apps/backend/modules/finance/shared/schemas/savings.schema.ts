import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const savingsGoalsSchema = sqliteTable('savings_goals', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  description: text('description'),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0).notNull(),
  targetDate: text('target_date'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('🎯'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  monthlyTarget: real('monthly_target'),
  category: text('category'),
});

export const savingsTransactionsSchema = sqliteTable('savings_transactions', {
  ...createSyncableEntity(),
  savingsGoalId: integer('savings_goal_id').notNull().references(() => savingsGoalsSchema.id),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['deposit', 'withdrawal'] }).notNull(),
  note: text('note'),
  date: text('date').notNull(),
});

export const savingsGoalsRelations = relations(savingsGoalsSchema, ({ many }) => ({
  transactions: many(savingsTransactionsSchema),
}));

export const savingsTransactionsRelations = relations(savingsTransactionsSchema, ({ one }) => ({
  savingsGoal: one(savingsGoalsSchema, {
    fields: [savingsTransactionsSchema.savingsGoalId],
    references: [savingsGoalsSchema.id],
  }),
}));

type TSavingsGoal = TBaseEntity & {
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  color: string;
  icon: string;
  isActive: boolean;
  monthlyTarget: number | null;
  category: string | null;
  synced: boolean;
};

type TSavingsGoalInsert = Omit<TSavingsGoal, 'id' | 'createdAt' | 'updatedAt'>;

type TSavingsGoalSelect = TSavingsGoal;

type TSavingsTransaction = TBaseEntity & {
  savingsGoalId: number;
  amount: number;
  type: 'deposit' | 'withdrawal';
  note: string | null;
  date: string;
  synced: boolean;
};

type TSavingsTransactionInsert = Omit<TSavingsTransaction, 'id' | 'createdAt' | 'updatedAt'>;

type TSavingsTransactionSelect = TSavingsTransaction;

export type { 
  TSavingsGoal, 
  TSavingsGoalInsert, 
  TSavingsGoalSelect,
  TSavingsTransaction,
  TSavingsTransactionInsert,
  TSavingsTransactionSelect
};
