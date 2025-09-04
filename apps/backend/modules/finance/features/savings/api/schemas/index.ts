import { z } from 'zod';

const savingsTransactionTypeSchema = z.enum(['deposit', 'withdrawal']);

const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative').optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format').optional(),
  isCompleted: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().max(10, 'Icon too long').optional(),
  isActive: z.boolean().optional(),
  monthlyTarget: z.number().positive('Monthly target must be positive').optional(),
  category: z.string().max(50, 'Category too long').optional()
});

const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

const createSavingsTransactionSchema = z.object({
  savingsGoalId: z.number().int().positive('Savings goal ID must be a positive integer'),
  amount: z.number().positive('Amount must be positive'),
  type: savingsTransactionTypeSchema,
  note: z.string().max(500, 'Note too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

const getSavingsGoalsQuerySchema = z.object({
  includeCompleted: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'targetAmount', 'progress', 'deadline', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const getSavingsTransactionsQuerySchema = z.object({
  goalId: z.coerce.number().int().positive().optional(),
  type: savingsTransactionTypeSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createSavingsTransactionSchema,
  getSavingsGoalsQuerySchema,
  getSavingsTransactionsQuerySchema,
  savingsTransactionTypeSchema
};
