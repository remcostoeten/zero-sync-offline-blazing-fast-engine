import { z } from 'zod';

// Core budget schemas
export const BudgetInsertSchema = z.object({
  categoryId: z.number().int().positive('Category ID must be positive'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  isActive: z.boolean().default(true),
  alertThreshold: z.number().min(0).max(100).default(80), // Percentage threshold for alerts
  notes: z.string().optional()
});

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

// Export types
export type TBudgetInsert = z.infer<typeof BudgetInsertSchema>;
export type TBudgetUpdate = z.infer<typeof BudgetUpdateSchema>;
export type TBudgetFilters = z.infer<typeof BudgetFiltersSchema>;
export type TBudgetUtilizationFilters = z.infer<typeof BudgetUtilizationFiltersSchema>;
export type TBudgetReset = z.infer<typeof BudgetResetSchema>;
