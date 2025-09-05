import { z } from 'zod';

// Categories validation schemas
export const CategoryInsertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().optional(),
  type: z.enum(['income', 'expense', 'debt', 'investment', 'savings'], {
    errorMap: () => ({ message: 'Type is required' })
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  monthlyBudgetLimit: z
    .union([z.string(), z.number()])
    .transform(val => val === '' || val === null || val === undefined ? undefined : Number(val))
    .refine(val => val === undefined || val >= 0, 'Must be a positive number')
    .optional()
});

// Create aliases for better naming
export const createCategorySchema = CategoryInsertSchema;
export const updateCategorySchema = CategoryInsertSchema.partial().extend({
  id: z.string().min(1, 'ID is required')
});

export const CategoryUpdateSchema = updateCategorySchema;

// Transactions validation schemas
export const TransactionInsertSchema = z.object({
  amount: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .refine(val => val > 0, 'Amount must be positive'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Transaction type is required' })
  }),
  categoryId: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .refine(val => val > 0, 'Please select a category'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  description: z.string().optional(),
  payee: z.string().optional(),
  reference: z.string().optional(),
  tags: z.array(z.string()).default([])
});

// Create aliases for better naming
export const createTransactionSchema = TransactionInsertSchema;
export const updateTransactionSchema = TransactionInsertSchema.partial().extend({
  id: z.string().min(1, 'ID is required')
});

export const TransactionUpdateSchema = updateTransactionSchema;

// Savings Goals validation schemas
export const SavingsGoalInsertSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  targetAmount: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .refine(val => val > 0, 'Target amount must be positive'),
  currentAmount: z
    .union([z.string(), z.number()])
    .transform(val => val === '' || val === null || val === undefined ? 0 : Number(val))
    .refine(val => val >= 0, 'Current amount cannot be negative')
    .default(0),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  isCompleted: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  monthlyTarget: z
    .union([z.string(), z.number()])
    .transform(val => val === '' || val === null || val === undefined ? undefined : Number(val))
    .refine(val => val === undefined || val > 0, 'Monthly target must be positive')
    .optional(),
  category: z.string().max(50, 'Category too long').optional()
}).refine(data => {
  // If target date is provided, ensure it's in the future
  if (data.targetDate) {
    const targetDate = new Date(data.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    if (targetDate <= today) {
      return false;
    }
  }
  
  // Current amount shouldn't exceed target amount
  if (data.currentAmount > data.targetAmount) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid savings goal: target date must be in future and current amount cannot exceed target"
});

// Create aliases for better naming
export const createSavingsGoalSchema = SavingsGoalInsertSchema;
export const updateSavingsGoalSchema = SavingsGoalInsertSchema.partial().extend({
  id: z.string().min(1, 'ID is required')
});

export const SavingsGoalUpdateSchema = updateSavingsGoalSchema;

// Savings Transactions validation schemas
export const SavingsTransactionInsertSchema = z.object({
  savingsGoalId: z.number().int().positive('Savings goal is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['deposit', 'withdrawal']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  description: z.string().optional(),
  reference: z.string().optional()
});

export const SavingsTransactionUpdateSchema = SavingsTransactionInsertSchema.partial();

// Budget validation schemas
export const BudgetInsertSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  categoryId: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .refine(val => val > 0, 'Please select a category'),
  amount: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .refine(val => val > 0, 'Budget amount must be positive'),
  spent: z
    .union([z.string(), z.number()])
    .transform(val => val === '' || val === null || val === undefined ? 0 : Number(val))
    .refine(val => val >= 0, 'Spent amount cannot be negative')
    .default(0),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Budget period is required' })
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  isActive: z.boolean().default(true),
  alertThreshold: z
    .union([z.string(), z.number()])
    .transform(val => val === '' || val === null || val === undefined ? 0.8 : Number(val))
    .refine(val => val >= 0.1 && val <= 1, 'Alert threshold must be between 10% and 100%')
    .default(0.8),
  rollover: z.boolean().default(false),
  carryoverAmount: z
    .union([z.string(), z.number()])
    .transform(val => val === '' || val === null || val === undefined ? 0 : Number(val))
    .refine(val => val >= 0, 'Carryover amount cannot be negative')
    .default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3B82F6'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  autoRenew: z.boolean().default(true),
  resetDay: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .refine(val => val >= 1 && val <= 31, 'Reset day must be between 1 and 31')
    .default(1)
}).refine(data => {
  // If end date is provided, ensure it's after start date
  if (data.endDate && data.startDate >= data.endDate) {
    return false;
  }
  
  // Spent amount shouldn't exceed budget amount + carryover
  if (data.spent > (data.amount + data.carryoverAmount)) {
    return false;
  }
  
  // Reset day validation based on period
  if (data.period === 'weekly' && data.resetDay > 7) {
    return false;
  }
  if (data.period === 'monthly' && data.resetDay > 31) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid budget configuration: check dates, spending amounts, and reset day settings"
});

// Create aliases for better naming
export const createBudgetSchema = BudgetInsertSchema;
export const updateBudgetSchema = BudgetInsertSchema.partial().extend({
  id: z.string().min(1, 'ID is required')
});

export const BudgetUpdateSchema = updateBudgetSchema;

// Recurring Transaction validation schemas
export const RecurringTransactionInsertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  categoryId: z.number().int().positive('Category is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  interval: z.number().int().min(1).max(12).default(1),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  monthOfYear: z.number().int().min(1).max(12).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  maxOccurrences: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  autoGenerate: z.boolean().default(true),
  notifyOnGeneration: z.boolean().default(false),
  payee: z.string().optional(),
  reference: z.string().optional(),
  tags: z.array(z.string()).default([])
}).refine((data) => {
  // Validate frequency-specific fields
  if (data.frequency === 'weekly' && data.dayOfWeek === undefined) {
    return false;
  }
  if ((data.frequency === 'monthly' || data.frequency === 'quarterly') && data.dayOfMonth === undefined) {
    return false;
  }
  if (data.frequency === 'yearly' && (data.dayOfMonth === undefined || data.monthOfYear === undefined)) {
    return false;
  }
  
  // Validate end conditions
  if (!data.endDate && !data.maxOccurrences) {
    return false;
  }
  
  // Validate date order
  if (data.endDate && data.startDate >= data.endDate) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid recurring pattern or missing required frequency fields"
});

export const RecurringTransactionUpdateSchema = RecurringTransactionInsertSchema.partial();

// Form field schemas for better type safety
export const DateFieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');
export const AmountFieldSchema = z.number().positive('Amount must be positive');
export const RequiredStringSchema = z.string().min(1, 'This field is required');
export const OptionalStringSchema = z.string().optional();

// Export types for use in components
export type CategoryFormData = z.infer<typeof CategoryInsertSchema>;
export type TransactionFormData = z.infer<typeof TransactionInsertSchema>;
export type SavingsGoalFormData = z.infer<typeof SavingsGoalInsertSchema>;
export type SavingsTransactionFormData = z.infer<typeof SavingsTransactionInsertSchema>;
export type BudgetFormData = z.infer<typeof BudgetInsertSchema>;
export type RecurringTransactionFormData = z.infer<typeof RecurringTransactionInsertSchema>;
