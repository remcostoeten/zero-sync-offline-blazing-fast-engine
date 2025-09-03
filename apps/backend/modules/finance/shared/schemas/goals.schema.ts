import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const financialGoalsSchema = sqliteTable('financial_goals', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0),
  targetDate: text('target_date'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  monthlyContribution: real('monthly_contribution').default(0),
  notes: text('notes'),
});

type TFinancialGoal = TBaseEntity & {
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  monthlyContribution: number;
  notes: string | null;
  synced: boolean;
};

type TFinancialGoalInsert = Omit<TFinancialGoal, 'id' | 'createdAt' | 'updatedAt'>;

type TFinancialGoalSelect = TFinancialGoal;

export type { TFinancialGoal, TFinancialGoalInsert, TFinancialGoalSelect };
