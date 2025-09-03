import { z } from 'zod';

const budgetPeriodSchema = z.enum(['monthly', 'yearly']);

const createBudgetSchema = z.object({
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  amount: z.number().positive('Budget amount must be positive'),
  period: budgetPeriodSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional()
});

const updateBudgetSchema = createBudgetSchema.partial();

const getBudgetsQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  period: budgetPeriodSchema.optional(),
  status: z.enum(['active', 'exceeded', 'completed', 'all']).optional(),
  includeInactive: z.coerce.boolean().optional(),
  sortBy: z.enum(['amount', 'spent', 'remaining', 'percentage', 'categoryName', 'startDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const budgetUtilizationQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  alertThreshold: z.number().min(0).max(100).optional() // percentage threshold for alerts
});

const resetBudgetSchema = z.object({
  newAmount: z.number().positive('New budget amount must be positive').optional(),
  newPeriod: budgetPeriodSchema.optional(),
  resetSpent: z.boolean().default(true)
});

export {
  createBudgetSchema,
  updateBudgetSchema,
  getBudgetsQuerySchema,
  budgetUtilizationQuerySchema,
  resetBudgetSchema,
  budgetPeriodSchema
};
