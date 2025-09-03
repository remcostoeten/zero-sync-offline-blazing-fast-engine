import { z } from 'zod';

const transactionTypeSchema = z.enum(['income', 'expense']);

const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: transactionTypeSchema,
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  note: z.string().max(500, 'Note too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

const updateTransactionSchema = createTransactionSchema.partial();

const getTransactionsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  type: transactionTypeSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const bulkImportTransactionSchema = z.object({
  transactions: z.array(createTransactionSchema).min(1, 'At least one transaction required').max(100, 'Maximum 100 transactions per batch')
});

export {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  bulkImportTransactionSchema,
  transactionTypeSchema
};
