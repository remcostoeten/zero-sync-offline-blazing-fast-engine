import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Helper functions for common fields (same as backend)
export const timestamps = {
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
};

export const syncableEntity = {
  ...timestamps,
  synced: integer('synced', { mode: 'boolean' }).default(false).notNull()
};

export const baseEntity = {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ...syncableEntity
};

// Categories Schema
export const categoriesSchema = sqliteTable('categories', {
  ...baseEntity,
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['income', 'expense', 'debt', 'investment', 'savings'] }).notNull(),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('📁'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  monthlyBudgetLimit: real('monthly_budget_limit'),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false).notNull()
});

// Transactions Schema
export const transactionsSchema = sqliteTable('transactions', {
  ...baseEntity,
  amount: real('amount').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  description: text('description'),
  payee: text('payee'),
  reference: text('reference'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  recurringTransactionId: integer('recurring_transaction_id'),
  savingsGoalId: integer('savings_goal_id'),
  debtPaymentId: integer('debt_payment_id'),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false).notNull()
});

// Savings Goals Schema
export const savingsGoalsSchema = sqliteTable('savings_goals', {
  ...baseEntity,
  name: text('name').notNull(),
  description: text('description'),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0).notNull(),
  targetDate: text('target_date'), // YYYY-MM-DD format, optional
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  color: text('color').default('#3B82F6'), // Goal color for visualization
  icon: text('icon').default('🎯'), // Goal icon
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  monthlyTarget: real('monthly_target'), // Optional monthly savings target
  category: text('category') // Optional category like 'vacation', 'emergency', 'house'
});

// Savings Transactions Schema
export const savingsTransactionsSchema = sqliteTable('savings_transactions', {
  ...baseEntity,
  savingsGoalId: integer('savings_goal_id').notNull(),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['deposit', 'withdrawal'] }).notNull(),
  date: text('date').notNull(),
  description: text('description'),
  reference: text('reference')
});

// Budgets Schema
export const budgetsSchema = sqliteTable('budgets', {
  ...baseEntity,
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  name: text('name').notNull(), // Budget name/description
  description: text('description'), // Optional detailed description
  amount: real('amount').notNull(), // Budget limit amount
  spent: real('spent').default(0).notNull(), // Current amount spent
  period: text('period', { enum: ['weekly', 'monthly', 'quarterly', 'yearly'] }).notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD format
  endDate: text('end_date'), // YYYY-MM-DD format, optional for recurring budgets
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  alertThreshold: real('alert_threshold').default(0.8), // Alert when 80% of budget used
  rollover: integer('rollover', { mode: 'boolean' }).default(false).notNull(), // Unused budget carries over
  carryoverAmount: real('carryover_amount').default(0), // Amount carried over from previous period
  color: text('color').default('#3B82F6'), // Budget color for visualization
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  autoRenew: integer('auto_renew', { mode: 'boolean' }).default(true).notNull(), // Auto-create for next period
  resetDay: integer('reset_day').default(1) // Day of month/week when budget resets
});

// Recurring Transactions Schema
export const recurringTransactionsSchema = sqliteTable('recurring_transactions', {
  ...baseEntity,
  name: text('name').notNull(),
  description: text('description'),
  categoryId: integer('category_id').notNull(),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  frequency: text('frequency', { 
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] 
  }).notNull(),
  interval: integer('interval').default(1),
  dayOfWeek: integer('day_of_week'),
  dayOfMonth: integer('day_of_month'),
  monthOfYear: integer('month_of_year'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  maxOccurrences: integer('max_occurrences'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  autoGenerate: integer('auto_generate', { mode: 'boolean' }).default(true).notNull(),
  notifyOnGeneration: integer('notify_on_generation', { mode: 'boolean' }).default(false).notNull(),
  payee: text('payee'),
  reference: text('reference'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  lastGenerated: text('last_generated'),
  generatedCount: integer('generated_count').default(0)
});

// Type exports (these would typically be inferred from the schemas)
export type TCategory = typeof categoriesSchema.$inferSelect;
export type TCategoryInsert = typeof categoriesSchema.$inferInsert;

export type TTransaction = typeof transactionsSchema.$inferSelect;
export type TTransactionInsert = typeof transactionsSchema.$inferInsert;

export type TSavingsGoal = typeof savingsGoalsSchema.$inferSelect;
export type TSavingsGoalInsert = typeof savingsGoalsSchema.$inferInsert;

export type TSavingsTransaction = typeof savingsTransactionsSchema.$inferSelect;
export type TSavingsTransactionInsert = typeof savingsTransactionsSchema.$inferInsert;

export type TBudget = typeof budgetsSchema.$inferSelect;
export type TBudgetInsert = typeof budgetsSchema.$inferInsert;

export type TRecurringTransaction = typeof recurringTransactionsSchema.$inferSelect;
export type TRecurringTransactionInsert = typeof recurringTransactionsSchema.$inferInsert;

// Aliases for component compatibility
export type Category = TCategory;
export type CategoryInsert = TCategoryInsert;
export type Transaction = TTransaction;
export type TransactionInsert = TTransactionInsert;
export type Budget = TBudget;
export type BudgetInsert = TBudgetInsert;
export type SavingsGoal = TSavingsGoal;
export type SavingsGoalInsert = TSavingsGoalInsert;
