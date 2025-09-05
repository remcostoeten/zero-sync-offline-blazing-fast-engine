import { z } from 'zod';

const budgetPeriodSchema = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);

// Core budget schemas
export const BudgetCreateSchema = z.object({
  categoryId: z.number().int().positive('Category ID must be positive'),
  name: z.string().min(1, 'Budget name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  period: budgetPeriodSchema.default('monthly'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  isActive: z.boolean().default(true).optional(),
  alertThreshold: z.number().min(0).max(1).default(0.8).optional(),
  rollover: z.boolean().default(false).optional(),
  carryoverAmount: z.number().min(0).default(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3B82F6').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  autoRenew: z.boolean().default(true).optional(),
  resetDay: z.number().int().min(1).max(31).default(1).optional()
});

export const BudgetInsertSchema = BudgetCreateSchema.partial();

export const BudgetUpdateSchema = BudgetInsertSchema.partial().extend({
  id: z.number().int().positive().optional()
});

// Filter schema
export const BudgetFiltersSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  period: z.enum(['monthly', 'yearly', 'all']).default('all'),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

// Budget utilization filters
export const BudgetUtilizationFiltersSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  period: z.enum(['monthly', 'yearly', 'all']).default('monthly'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  alertsOnly: z.boolean().default(false)
});

// Budget reset schema
export const BudgetResetSchema = z.object({
  newAmount: z.number().positive().optional(),
  resetPeriod: z.boolean().default(true),
  resetSpent: z.boolean().default(true),
  notes: z.string().optional()
});

// Legacy exports for backward compatibility
export const createBudgetSchema = BudgetCreateSchema;
export const updateBudgetSchema = BudgetUpdateSchema;
export const getBudgetsQuerySchema = BudgetFiltersSchema;
export const budgetUtilizationQuerySchema = BudgetUtilizationFiltersSchema;
export const resetBudgetSchema = BudgetResetSchema;

// Export types
export type TBudgetInsert = z.infer<typeof BudgetInsertSchema>;
export type TBudgetUpdate = z.infer<typeof BudgetUpdateSchema>;
export type TBudgetFilters = z.infer<typeof BudgetFiltersSchema>;
export type TBudgetUtilizationFilters = z.infer<typeof BudgetUtilizationFiltersSchema>;
export type TBudgetReset = z.infer<typeof BudgetResetSchema>;
