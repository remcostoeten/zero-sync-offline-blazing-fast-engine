import { z } from 'zod';

// Core debt schemas
const DebtInsertBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  creditor: z.string().min(1, 'Creditor is required').max(100, 'Creditor name too long'),
  
  // Financial details
  principal: z.number().positive('Principal amount must be positive'),
  currentBalance: z.number().min(0, 'Current balance cannot be negative'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  interestType: z.enum(['simple', 'compound']).default('compound'),
  compoundingFrequency: z.enum(['daily', 'monthly', 'quarterly', 'annually']).default('monthly'),
  
  // Dates
  originationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  
  // Payment terms
  minimumPayment: z.number().positive('Minimum payment must be positive').optional(),
  paymentFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']).default('monthly'),
  nextPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  
  // Debt type and status
  debtType: z.enum(['credit_card', 'personal_loan', 'mortgage', 'auto_loan', 'student_loan', 'line_of_credit', 'other']),
  status: z.enum(['active', 'paid_off', 'defaulted', 'consolidated']).default('active'),
  
  // Optional fields
  accountNumber: z.string().optional(),
  creditLimit: z.number().positive().optional(), // For credit cards and lines of credit
  
  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const DebtInsertSchema = DebtInsertBaseSchema.refine((data) => {
  // Current balance cannot exceed principal for most debt types
  if (['personal_loan', 'mortgage', 'auto_loan', 'student_loan'].includes(data.debtType) && 
      data.currentBalance > data.principal) {
    return false;
  }
  
  // Maturity date must be after origination date
  if (data.maturityDate && data.originationDate >= data.maturityDate) {
    return false;
  }
  
  // Credit limit validation for credit cards
  if (data.debtType === 'credit_card' && data.creditLimit && data.currentBalance > data.creditLimit) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid debt configuration"
});

export const DebtUpdateSchema = DebtInsertBaseSchema.partial().extend({
  id: z.number().int().positive().optional()
});

// Payment schemas
export const DebtPaymentInsertSchema = z.object({
  debtId: z.number().int().positive('Debt ID must be positive'),
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  paymentType: z.enum(['regular', 'extra', 'minimum', 'interest_only']).default('regular'),
  
  // Payment allocation
  principalAmount: z.number().min(0, 'Principal amount cannot be negative').optional(),
  interestAmount: z.number().min(0, 'Interest amount cannot be negative').optional(),
  feesAmount: z.number().min(0, 'Fees amount cannot be negative').default(0),
  
  // Payment method and reference
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'auto_pay', 'credit_card', 'other']).optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  
  // Verification
  isVerified: z.boolean().default(false)
}).refine((data) => {
  // If principal and interest amounts are specified, they should not exceed total payment
  if (data.principalAmount !== undefined && data.interestAmount !== undefined) {
    const allocatedAmount = data.principalAmount + data.interestAmount + (data.feesAmount || 0);
    if (allocatedAmount > data.amount) {
      return false;
    }
  }
  return true;
}, {
  message: "Payment allocation exceeds total payment amount"
});

// Create base schema without refine for partial operations
const DebtPaymentInsertBaseSchema = z.object({
  debtId: z.number().int().positive('Debt ID must be positive'),
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  paymentType: z.enum(['regular', 'extra', 'minimum', 'interest_only']).default('regular'),
  
  // Payment allocation
  principalAmount: z.number().min(0, 'Principal amount cannot be negative').optional(),
  interestAmount: z.number().min(0, 'Interest amount cannot be negative').optional(),
  feesAmount: z.number().min(0, 'Fees amount cannot be negative').default(0),
  
  // Payment method and reference
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'auto_pay', 'credit_card', 'other']).optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  
  // Verification
  isVerified: z.boolean().default(false)
});

export const DebtPaymentUpdateSchema = DebtPaymentInsertBaseSchema.partial().extend({
  id: z.number().int().positive().optional()
});

// Query and filter schemas
export const DebtFiltersSchema = z.object({
  debtType: z.enum(['credit_card', 'personal_loan', 'mortgage', 'auto_loan', 'student_loan', 'line_of_credit', 'other', 'all']).default('all'),
  status: z.enum(['active', 'paid_off', 'defaulted', 'consolidated', 'all']).default('all'),
  creditor: z.string().optional(),
  
  // Balance filters
  minBalance: z.number().min(0).optional(),
  maxBalance: z.number().min(0).optional(),
  minInterestRate: z.number().min(0).optional(),
  maxInterestRate: z.number().min(0).optional(),
  
  // Date filters
  originationFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  originationTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maturityFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maturityTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  // Sorting and pagination
  sortBy: z.enum(['name', 'creditor', 'balance', 'interestRate', 'nextPayment', 'maturityDate']).default('balance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  
  // Search
  search: z.string().optional()
});

export const PaymentFiltersSchema = z.object({
  debtId: z.number().int().positive().optional(),
  paymentType: z.enum(['regular', 'extra', 'minimum', 'interest_only', 'all']).default('all'),
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'auto_pay', 'credit_card', 'other', 'all']).default('all'),
  isVerified: z.boolean().optional(),
  
  // Date filters
  paymentDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  // Amount filters
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  
  // Sorting and pagination
  sortBy: z.enum(['paymentDate', 'amount', 'debtName', 'creditor']).default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

// Amortization and payment schedule schemas
export const AmortizationRequestSchema = z.object({
  debtId: z.number().int().positive(),
  paymentAmount: z.number().positive().optional(), // If not provided, use minimum payment
  extraPayment: z.number().min(0).default(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxPayments: z.number().int().min(1).max(1000).default(360) // 30 years max
});

export const PaymentScheduleGenerationSchema = z.object({
  debtIds: z.array(z.number().int().positive()).min(1).max(20),
  strategy: z.enum(['avalanche', 'snowball', 'minimum', 'custom']).default('minimum'),
  totalMonthlyBudget: z.number().positive().optional(),
  extraPaymentAmount: z.number().min(0).default(0),
  priorityDebtId: z.number().int().positive().optional(), // For custom strategy
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Debt consolidation schema
export const DebtConsolidationSchema = z.object({
  sourceDebtIds: z.array(z.number().int().positive()).min(2).max(10),
  newDebtData: DebtInsertBaseSchema.omit({ principal: true, currentBalance: true }),
  consolidationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  consolidationFees: z.number().min(0).default(0)
});

// Interest calculation schema
export const InterestCalculationSchema = z.object({
  debtId: z.number().int().positive(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  includePayments: z.boolean().default(true)
});

// Bulk operations schemas
export const BulkDebtCreateSchema = z.object({
  debts: z.array(DebtInsertSchema).min(1).max(20)
});

export const BulkDebtUpdateSchema = z.object({
  updates: z.array(DebtUpdateSchema.extend({ 
    id: z.number().int().positive() 
  })).min(1).max(20)
});

export const BulkPaymentCreateSchema = z.object({
  payments: z.array(DebtPaymentInsertSchema).min(1).max(50)
});

// Analysis and reporting schemas
export const DebtAnalysisRequestSchema = z.object({
  debtIds: z.array(z.number().int().positive()).optional(), // If empty, analyze all active debts
  includeProjections: z.boolean().default(true),
  projectionYears: z.number().int().min(1).max(30).default(5),
  analysisDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const DebtComparisonSchema = z.object({
  scenarios: z.array(z.object({
    name: z.string(),
    strategy: z.enum(['avalanche', 'snowball', 'minimum']),
    extraPaymentAmount: z.number().min(0).default(0),
    totalMonthlyBudget: z.number().positive().optional()
  })).min(2).max(5)
});

// Export types
export type TDebtInsert = z.infer<typeof DebtInsertSchema>;
export type TDebtUpdate = z.infer<typeof DebtUpdateSchema>;
export type TDebtPaymentInsert = z.infer<typeof DebtPaymentInsertSchema>;
export type TDebtPaymentUpdate = z.infer<typeof DebtPaymentUpdateSchema>;
export type TDebtFilters = z.infer<typeof DebtFiltersSchema>;
export type TPaymentFilters = z.infer<typeof PaymentFiltersSchema>;
export type TAmortizationRequest = z.infer<typeof AmortizationRequestSchema>;
export type TPaymentScheduleGeneration = z.infer<typeof PaymentScheduleGenerationSchema>;
export type TDebtConsolidation = z.infer<typeof DebtConsolidationSchema>;
export type TInterestCalculation = z.infer<typeof InterestCalculationSchema>;
export type TDebtAnalysisRequest = z.infer<typeof DebtAnalysisRequestSchema>;
export type TDebtComparison = z.infer<typeof DebtComparisonSchema>;
