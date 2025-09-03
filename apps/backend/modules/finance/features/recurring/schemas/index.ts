import { z } from 'zod';

// Core recurring transaction schemas
export const RecurringTransactionInsertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  categoryId: z.number().int().positive('Category ID must be positive'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  
  // Recurring pattern
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  interval: z.number().int().min(1).max(12).default(1), // Every X intervals
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0=Sunday, for weekly
  dayOfMonth: z.number().int().min(1).max(31).optional(), // For monthly/quarterly/yearly
  monthOfYear: z.number().int().min(1).max(12).optional(), // For yearly
  
  // Scheduling
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  maxOccurrences: z.number().int().positive().optional(),
  
  // Status and settings
  isActive: z.boolean().default(true),
  autoGenerate: z.boolean().default(true),
  notifyOnGeneration: z.boolean().default(false),
  
  // Transaction details
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

export const RecurringTransactionUpdateSchema = RecurringTransactionInsertSchema.partial().extend({
  id: z.number().int().positive().optional()
});

// Query and filter schemas
export const RecurringTransactionFiltersSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  type: z.enum(['income', 'expense', 'all']).default('all'),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'all']).default('all'),
  isActive: z.boolean().optional(),
  autoGenerate: z.boolean().optional(),
  
  // Date filters
  startDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextExecutionFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextExecutionTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  // Sorting and pagination
  sortBy: z.enum(['name', 'amount', 'startDate', 'nextExecution', 'frequency', 'categoryName']).default('nextExecution'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  
  // Search
  search: z.string().optional()
});

// Transaction generation schemas
export const GenerateTransactionsSchema = z.object({
  recurringId: z.number().int().positive().optional(), // If not provided, generates for all active
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dryRun: z.boolean().default(false), // Preview mode
  force: z.boolean().default(false), // Ignore duplicate checks
  maxTransactions: z.number().int().min(1).max(1000).default(100)
});

export const GenerationResultSchema = z.object({
  recurringId: z.number().int().positive(),
  recurringName: z.string(),
  generatedCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  nextExecution: z.string().optional(),
  transactions: z.array(z.object({
    id: z.number().int().positive().optional(),
    date: z.string(),
    amount: z.number(),
    status: z.enum(['generated', 'skipped', 'error']),
    reason: z.string().optional()
  }))
});

// Schedule management schemas
export const ScheduleAnalysisSchema = z.object({
  recurringId: z.number().int().positive(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxDates: z.number().int().min(1).max(100).default(10)
});

export const RecurringScheduleUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  autoGenerate: z.boolean().optional(),
  nextExecutionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pauseUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  skipNext: z.boolean().optional()
});

// Bulk operations schemas
export const BulkRecurringCreateSchema = z.object({
  recurring: z.array(RecurringTransactionInsertSchema).min(1).max(50)
});

export const BulkRecurringUpdateSchema = z.object({
  updates: z.array(RecurringTransactionUpdateSchema.extend({ 
    id: z.number().int().positive() 
  })).min(1).max(50)
});

export const BulkRecurringDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(50),
  deleteGeneratedTransactions: z.boolean().default(false)
});

// Advanced pattern schemas for complex recurring rules
export const AdvancedRecurringPatternSchema = z.object({
  // Custom interval patterns
  customInterval: z.object({
    value: z.number().int().min(1).max(365),
    unit: z.enum(['days', 'weeks', 'months', 'years'])
  }).optional(),
  
  // Specific days of month (for monthly patterns)
  specificDays: z.array(z.number().int().min(1).max(31)).max(10).optional(),
  
  // Business day adjustments
  businessDaysOnly: z.boolean().default(false),
  adjustForHolidays: z.boolean().default(false),
  holidayAdjustment: z.enum(['before', 'after', 'skip']).default('after'),
  
  // End of month handling
  endOfMonth: z.boolean().default(false), // Last day of month
  
  // Exclude specific dates
  excludeDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  
  // Include specific dates (one-time additions to pattern)
  includeDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional()
});

// Export types
export type TRecurringTransactionInsert = z.infer<typeof RecurringTransactionInsertSchema>;
export type TRecurringTransactionUpdate = z.infer<typeof RecurringTransactionUpdateSchema>;
export type TRecurringTransactionFilters = z.infer<typeof RecurringTransactionFiltersSchema>;
export type TGenerateTransactions = z.infer<typeof GenerateTransactionsSchema>;
export type TGenerationResult = z.infer<typeof GenerationResultSchema>;
export type TScheduleAnalysis = z.infer<typeof ScheduleAnalysisSchema>;
export type TRecurringScheduleUpdate = z.infer<typeof RecurringScheduleUpdateSchema>;
export type TAdvancedRecurringPattern = z.infer<typeof AdvancedRecurringPatternSchema>;
