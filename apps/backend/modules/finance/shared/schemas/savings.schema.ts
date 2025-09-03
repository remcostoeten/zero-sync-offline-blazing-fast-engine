import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const savingsGoalsSchema = sqliteTable('savings_goals', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0),
  deadline: text('deadline'),
  description: text('description'),
  color: text('color').default('#10B981'),
  icon: text('icon').default('🎯'),
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
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  description: string | null;
  color: string;
  icon: string;
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
