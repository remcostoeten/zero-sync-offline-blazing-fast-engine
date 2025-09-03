import express from 'express';
import { z } from 'zod';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  setupFinanceDatabase,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal,
  addSavingsTransaction,
  getSavingsTransactions,
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetVsActual,
  createRecurringTransaction,
  getRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  generateRecurringTransactions,
  createTag,
  getTags,
  updateTag,
  deleteTag,
  addTagsToTransaction,
  removeTagsFromTransaction,
  getTransactionTags,
  createAlert,
  getAlerts,
  markAlertAsRead,
  dismissAlert,
  deleteAlert,
  generateAllAlerts,
  setDefaultCurrency,
  getDefaultCurrency,
  updateExchangeRate,
  getExchangeRate,
  convertCurrency,
  populateDefaultExchangeRates,
  generateFinancialForecast,
  createDebt,
  getDebts,
  updateDebt,
  deleteDebt,
  addDebtPayment,
  getDebtPayments,
  getDebtSummary,
  createFinancialGoal,
  getFinancialGoals,
  updateFinancialGoal,
  deleteFinancialGoal,
  addToFinancialGoal,
  checkRecurringBudgetAlerts,
  getDashboardData,
  getFinancialSummary,
  logAuditAction,
  getAuditLog,
  syncFinanceData,
  getSyncStatus,
  populateFinanceDemoData
} from './finance-app';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'null', 'file://'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// VALIDATION SCHEMAS (Zod)
// ============================================================================

// Category validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  type: z.enum(['income', 'expense'], { message: 'Type must be either income or expense' }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().max(10, 'Icon too long').optional()
});

const updateCategorySchema = createCategorySchema.partial();

// Transaction validation schemas
const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense'], { message: 'Type must be either income or expense' }),
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  note: z.string().max(500, 'Note too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

const updateTransactionSchema = createTransactionSchema.partial();

// Savings validation schemas
const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Savings goal name is required').max(100, 'Savings goal name too long'),
  targetAmount: z.number().positive('Target amount must be positive'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().max(10, 'Icon too long').optional()
});

const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

const savingsTransactionSchema = z.object({
  goalId: z.number().int().positive('Goal ID must be a positive integer'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['deposit', 'withdrawal'], { message: 'Type must be either deposit or withdrawal' }),
  note: z.string().max(500, 'Note too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

// Budget validation schemas
const createBudgetSchema = z.object({
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'yearly'], { message: 'Period must be either monthly or yearly' }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional()
});

const updateBudgetSchema = createBudgetSchema.partial();

// Recurring transaction validation schemas
const createRecurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense'], { message: 'Type must be either income or expense' }),
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  recurrenceRule: z.enum(['weekly', 'monthly', 'yearly'], { message: 'Recurrence rule must be weekly, monthly, or yearly' }),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next due date must be in YYYY-MM-DD format'),
  note: z.string().max(500, 'Note too long').optional()
});

const updateRecurringTransactionSchema = createRecurringTransactionSchema.partial();

// Tag validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  description: z.string().max(200, 'Description too long').optional()
});

const updateTagSchema = createTagSchema.partial();

// Transaction tags validation schema
const transactionTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive('Tag ID must be a positive integer')).min(1, 'At least one tag ID is required')
});

// Alert validation schemas
const createAlertSchema = z.object({
  type: z.enum(['budget_warning', 'recurring_due', 'savings_deadline', 'custom'], { message: 'Invalid alert type' }),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  severity: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Invalid severity level' }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional(),
  relatedId: z.number().int().positive('Related ID must be a positive integer').optional(),
  relatedType: z.string().max(100, 'Related type too long').optional()
});

// Currency validation schemas
const currencySchema = z.object({
  currency: z.string().length(3, 'Currency must be 3 characters').regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters')
});

const exchangeRateSchema = z.object({
  fromCurrency: z.string().length(3, 'From currency must be 3 characters').regex(/^[A-Z]{3}$/, 'From currency must be uppercase letters'),
  toCurrency: z.string().length(3, 'To currency must be 3 characters').regex(/^[A-Z]{3}$/, 'To currency must be uppercase letters'),
  rate: z.number().positive('Exchange rate must be positive')
});

// Debt validation schemas
const createDebtSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.enum(['loan', 'credit_card', 'mortgage', 'personal_debt', 'other'], { message: 'Invalid debt type' }),
  originalAmount: z.number().positive('Original amount must be positive'),
  currentBalance: z.number().min(0, 'Current balance cannot be negative'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative'),
  minimumPayment: z.number().min(0, 'Minimum payment cannot be negative'),
  paymentFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'], { message: 'Invalid payment frequency' }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

const debtPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be in YYYY-MM-DD format'),
  isExtraPayment: z.boolean().default(false),
  notes: z.string().max(1000, 'Notes too long').optional()
});

// Financial goals validation schemas
const createFinancialGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.string().min(1, 'Type is required').max(100, 'Type too long'),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format').optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Invalid priority level' }).default('medium'),
  monthlyContribution: z.number().min(0, 'Monthly contribution cannot be negative').default(0),
  notes: z.string().max(1000, 'Notes too long').optional()
});

const forecastSchema = z.object({
  months: z.number().int().min(1, 'Months must be at least 1').max(60, 'Months cannot exceed 60').default(6),
  currency: z.string().length(3, 'Currency must be 3 characters').regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters').default('USD')
});

// Query parameter validation schemas
const transactionFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.string().optional(),
  limit: z.string().optional()
});

const summaryFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err: AppError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Zod validation errors
  if (err instanceof z.ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    error = new CustomError(`Validation Error: ${message}`, 400);
  }

  // Database errors
  if (err.message?.includes('SQLite error')) {
    error = new CustomError('Database operation failed', 500);
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================

const validateRequest = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error);
      } else {
        next(new CustomError('Validation failed', 400));
      }
    }
  };
};

const validateQuery = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error);
      } else {
        next(new CustomError('Query validation failed', 400));
      }
    }
  };
};

// ============================================================================
// API ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finance API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================================
// CATEGORY ENDPOINTS
// ============================================================================

// POST /categories - Add category
app.post('/categories', validateRequest(createCategorySchema), async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;
    
    const success = await createCategory(name, type, color, icon);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { name, type, color, icon }
      });
    } else {
      throw new CustomError('Failed to create category', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /categories - List categories
app.get('/categories', async (req, res, next) => {
  try {
    const { type } = req.query;
    const categories = await getCategories(type as 'income' | 'expense' | undefined);
    
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /categories/:id - Update category
app.put('/categories/:id', validateRequest(updateCategorySchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid category ID', 400);
    }
    
    const success = await updateCategory(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { id, ...req.body }
      });
    } else {
      throw new CustomError('Failed to update category', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /categories/:id - Remove category
app.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid category ID', 400);
    }
    
    const success = await deleteCategory(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete category or category has associated transactions', 400);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TRANSACTION ENDPOINTS
// ============================================================================

// POST /transactions - Add transaction
app.post('/transactions', validateRequest(createTransactionSchema), async (req, res, next) => {
  try {
    const { amount, type, categoryId, note, date } = req.body;
    
    const success = await createTransaction(amount, type, categoryId, note, date);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: { amount, type, categoryId, note, date }
      });
    } else {
      throw new CustomError('Failed to create transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /transactions - List transactions with filters
app.get('/transactions', async (req, res, next) => {
  try {
    const { startDate, endDate, categoryId, type, limit } = req.query;
    
    const filters = {
      startDate: startDate && startDate !== '' ? startDate as string : undefined,
      endDate: endDate && endDate !== '' ? endDate as string : undefined,
      categoryId: categoryId && categoryId !== '' ? categoryId as number : undefined,
      type: type && type !== '' ? type as 'income' | 'expense' : undefined,
      limit: limit && limit !== '' ? limit as number : undefined
    };
    
    const transactions = await getTransactions(filters);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      filters
    });
  } catch (error) {
    next(error);
  }
});

// PUT /transactions/:id - Update transaction
app.put('/transactions/:id', validateRequest(updateTransactionSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid transaction ID', 400);
    }
    
    const success = await updateTransaction(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: { id, ...req.body }
      });
    } else {
      throw new CustomError('Failed to update transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /transactions/:id - Remove transaction
app.delete('/transactions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid transaction ID', 400);
    }
    
    const success = await deleteTransaction(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SAVINGS ENDPOINTS
// ============================================================================

// POST /savings - Add savings goal
app.post('/savings', validateRequest(createSavingsGoalSchema), async (req, res, next) => {
  try {
    const { name, targetAmount, deadline, description, color, icon } = req.body;
    
    const success = await createSavingsGoal(name, targetAmount, deadline, description, color, icon);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Savings goal created successfully',
        data: { name, targetAmount, deadline, description, color, icon }
      });
    } else {
      throw new CustomError('Failed to create savings goal', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /savings - List savings goals with progress
app.get('/savings', async (req, res, next) => {
  try {
    const savingsGoals = await getSavingsGoals();
    
    res.json({
      success: true,
      data: savingsGoals,
      count: savingsGoals.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /savings/:id - Update savings goal
app.put('/savings/:id', validateRequest(updateSavingsGoalSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid savings goal ID', 400);
    }
    
    const success = await updateSavingsGoal(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Savings goal updated successfully',
        data: { id, ...req.body }
      });
    } else {
      throw new CustomError('Failed to update savings goal', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /savings/:id - Remove savings goal
app.delete('/savings/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid savings goal ID', 400);
    }
    
    const success = await deleteSavingsGoal(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Savings goal deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete savings goal or goal has associated transactions', 400);
    }
  } catch (error) {
    next(error);
  }
});

// POST /savings/:id/transactions - Add savings transaction
app.post('/savings/:id/transactions', validateRequest(savingsTransactionSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid savings goal ID', 400);
    }
    
    const { amount, type, note, date } = req.body;
    
    const success = await addSavingsTransaction(id, amount, type, note, date);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Savings transaction added successfully',
        data: { goalId: id, amount, type, note, date }
      });
    } else {
      throw new CustomError('Failed to add savings transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /savings/:id/transactions - Get savings transactions for a goal
app.get('/savings/:id/transactions', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid savings goal ID', 400);
    }
    
    const transactions = await getSavingsTransactions(id);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// BUDGET ENDPOINTS
// ============================================================================

// POST /budgets - Add budget
app.post('/budgets', validateRequest(createBudgetSchema), async (req, res, next) => {
  try {
    const { categoryId, amount, period, startDate, endDate } = req.body;
    
    const success = await createBudget(categoryId, amount, period, startDate, endDate);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: { categoryId, amount, period, startDate, endDate }
      });
    } else {
      throw new CustomError('Failed to create budget', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /budgets - List budgets
app.get('/budgets', async (req, res, next) => {
  try {
    const budgets = await getBudgets();
    
    res.json({
      success: true,
      data: budgets,
      count: budgets.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /budgets/:id - Update budget
app.put('/budgets/:id', validateRequest(updateBudgetSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid budget ID', 400);
    }
    
    const success = await updateBudget(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Budget updated successfully',
        data: { id, ...req.body }
      });
    } else {
      throw new CustomError('Failed to update budget', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /budgets/:id - Remove budget
app.delete('/budgets/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid budget ID', 400);
    }
    
    const success = await deleteBudget(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Budget deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete budget', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RECURRING TRANSACTIONS ENDPOINTS
// ============================================================================

// POST /recurring - Add recurring transaction
app.post('/recurring', validateRequest(createRecurringTransactionSchema), async (req, res, next) => {
  try {
    const { name, amount, type, categoryId, recurrenceRule, nextDueDate, note } = req.body;
    
    const success = await createRecurringTransaction(name, amount, type, categoryId, recurrenceRule, nextDueDate, note);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Recurring transaction created successfully',
        data: { name, amount, type, categoryId, recurrenceRule, nextDueDate, note }
      });
    } else {
      throw new CustomError('Failed to create recurring transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /recurring - List recurring transactions
app.get('/recurring', async (req, res, next) => {
  try {
    const recurring = await getRecurringTransactions();
    
    res.json({
      success: true,
      data: recurring,
      count: recurring.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /recurring/:id - Update recurring transaction
app.put('/recurring/:id', validateRequest(updateRecurringTransactionSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid recurring transaction ID', 400);
    }
    
    const success = await updateRecurringTransaction(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Recurring transaction updated successfully',
        data: { id, ...req.body }
      });
    } else {
      throw new CustomError('Failed to update recurring transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /recurring/:id - Remove recurring transaction
app.delete('/recurring/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid recurring transaction ID', 400);
    }
    
    const success = await deleteRecurringTransaction(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Recurring transaction deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete recurring transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// POST /recurring/generate - Generate recurring transactions
app.post('/recurring/generate', async (req, res, next) => {
  try {
    const generated = await generateRecurringTransactions();
    
    res.json({
      success: true,
      message: `Generated ${generated} recurring transactions`,
      data: { generated }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TAGS ENDPOINTS
// ============================================================================

// POST /tags - Add tag
app.post('/tags', validateRequest(createTagSchema), async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    
    const success = await createTag(name, color, description);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        data: { name, color, description }
      });
    } else {
      throw new CustomError('Failed to create tag', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /tags - List tags
app.get('/tags', async (req, res, next) => {
  try {
    const tags = await getTags();
    
    res.json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /tags/:id - Update tag
app.put('/tags/:id', validateRequest(updateTagSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid tag ID', 400);
    }
    
    const success = await updateTag(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Tag updated successfully',
        data: { id, ...req.body }
      });
    } else {
      throw new CustomError('Failed to update tag', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /tags/:id - Remove tag
app.delete('/tags/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid tag ID', 400);
    }
    
    const success = await deleteTag(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Tag deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete tag', 500);
    }
  } catch (error) {
    next(error);
  }
});

// POST /transactions/:id/tags - Add tags to transaction
app.post('/transactions/:id/tags', validateRequest(transactionTagsSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid transaction ID', 400);
    }
    
    const { tagIds } = req.body;
    
    const success = await addTagsToTransaction(id, tagIds);
    
    if (success) {
      res.json({
        success: true,
        message: 'Tags added to transaction successfully',
        data: { transactionId: id, tagIds }
      });
    } else {
      throw new CustomError('Failed to add tags to transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /transactions/:id/tags - Remove tags from transaction
app.delete('/transactions/:id/tags', validateRequest(transactionTagsSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid transaction ID', 400);
    }
    
    const { tagIds } = req.body;
    
    const success = await removeTagsFromTransaction(id, tagIds);
    
    if (success) {
      res.json({
        success: true,
        message: 'Tags removed from transaction successfully',
        data: { transactionId: id, tagIds }
      });
    } else {
      throw new CustomError('Failed to remove tags from transaction', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /transactions/:id/tags - Get tags for transaction
app.get('/transactions/:id/tags', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid transaction ID', 400);
    }
    
    const tags = await getTransactionTags(id);
    
    res.json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ALERTS & REMINDERS ENDPOINTS
// ============================================================================

// POST /alerts - Create custom alert
app.post('/alerts', validateRequest(createAlertSchema), async (req, res, next) => {
  try {
    const { type, title, message, severity, dueDate, relatedId, relatedType } = req.body;
    
    const success = await createAlert(type, title, message, severity, dueDate, relatedId, relatedType);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: { type, title, message, severity, dueDate, relatedId, relatedType }
      });
    } else {
      throw new CustomError('Failed to create alert', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /alerts - List alerts
app.get('/alerts', async (req, res, next) => {
  try {
    const { isRead, isDismissed, type, severity } = req.query;
    
    const filters: any = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (isDismissed !== undefined) filters.isDismissed = isDismissed === 'true';
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    
    const alerts = await getAlerts(filters);
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /alerts/:id/read - Mark alert as read
app.put('/alerts/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid alert ID', 400);
    }
    
    const success = await markAlertAsRead(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } else {
      throw new CustomError('Failed to mark alert as read', 500);
    }
  } catch (error) {
    next(error);
  }
});

// PUT /alerts/:id/dismiss - Dismiss alert
app.put('/alerts/:id/dismiss', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid alert ID', 400);
    }
    
    const success = await dismissAlert(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert dismissed'
      });
    } else {
      throw new CustomError('Failed to dismiss alert', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /alerts/:id - Delete alert
app.delete('/alerts/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid alert ID', 400);
    }
    
    const success = await deleteAlert(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete alert', 500);
    }
  } catch (error) {
    next(error);
  }
});

// POST /alerts/generate - Generate all alerts and reminders
app.post('/alerts/generate', async (req, res, next) => {
  try {
    const alerts = await generateAllAlerts();
    
    res.json({
      success: true,
      message: `Generated ${alerts.total} alerts and reminders`,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CURRENCY & CONVERSION ENDPOINTS
// ============================================================================

// PUT /currency/default - Set default currency
app.put('/currency/default', validateRequest(currencySchema), async (req, res, next) => {
  try {
    const { currency } = req.body;
    
    const success = await setDefaultCurrency(currency);
    
    if (success) {
      res.json({
        success: true,
        message: `Default currency set to ${currency}`,
        data: { currency }
      });
    } else {
      throw new CustomError('Failed to set default currency', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /currency/default - Get default currency
app.get('/currency/default', async (req, res, next) => {
  try {
    const currency = await getDefaultCurrency();
    
    res.json({
      success: true,
      data: { currency }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /currency/rates - Update exchange rate
app.put('/currency/rates', validateRequest(exchangeRateSchema), async (req, res, next) => {
  try {
    const { fromCurrency, toCurrency, rate } = req.body;
    
    const success = await updateExchangeRate(fromCurrency, toCurrency, rate);
    
    if (success) {
      res.json({
        success: true,
        message: 'Exchange rate updated successfully',
        data: { fromCurrency, toCurrency, rate }
      });
    } else {
      throw new CustomError('Failed to update exchange rate', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /currency/convert - Convert amount between currencies
app.get('/currency/convert', async (req, res, next) => {
  try {
    const { amount, from, to } = req.query;
    
    if (!amount || !from || !to) {
      throw new CustomError('Amount, from, and to parameters are required', 400);
    }
    
    const numAmount = parseFloat(amount as string);
    if (isNaN(numAmount)) {
      throw new CustomError('Invalid amount', 400);
    }
    
    const convertedAmount = await convertCurrency(numAmount, from as string, to as string);
    
    res.json({
      success: true,
      data: {
        originalAmount: numAmount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount,
        rate: convertedAmount / numAmount
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /currency/populate - Populate default exchange rates
app.post('/currency/populate', async (req, res, next) => {
  try {
    const success = await populateDefaultExchangeRates();
    
    if (success) {
      res.json({
        success: true,
        message: 'Default exchange rates populated successfully'
      });
    } else {
      throw new CustomError('Failed to populate exchange rates', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

// GET /dashboard - Get comprehensive dashboard data
app.get('/dashboard', async (req, res, next) => {
  try {
    const { currency } = req.query;
    const defaultCurrency = currency as string || 'USD';
    
    const dashboardData = await getDashboardData(defaultCurrency);
    
    if (dashboardData) {
      res.json({
        success: true,
        data: dashboardData
      });
    } else {
      throw new CustomError('Failed to generate dashboard data', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FORECASTING ENDPOINTS
// ============================================================================

// GET /forecast - Generate financial forecast
app.get('/forecast', validateRequest(forecastSchema, 'query'), async (req, res, next) => {
  try {
    const { months, currency } = req.query;
    const numMonths = parseInt(months as string) || 6;
    const defaultCurrency = currency as string || 'USD';
    
    const forecast = await generateFinancialForecast(numMonths, defaultCurrency);
    
    if (forecast) {
      res.json({
        success: true,
        data: forecast
      });
    } else {
      throw new CustomError('Failed to generate financial forecast', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DEBT & LOANS ENDPOINTS
// ============================================================================

// POST /debts - Create new debt
app.post('/debts', validateRequest(createDebtSchema), async (req, res, next) => {
  try {
    const { name, type, originalAmount, currentBalance, interestRate, minimumPayment, paymentFrequency, startDate, endDate, notes } = req.body;
    
    const success = await createDebt(name, type, originalAmount, currentBalance, interestRate, minimumPayment, paymentFrequency, startDate, endDate, notes);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Debt created successfully',
        data: { name, type, originalAmount, currentBalance, interestRate, minimumPayment, paymentFrequency, startDate, endDate, notes }
      });
    } else {
      throw new CustomError('Failed to create debt', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /debts - List all debts
app.get('/debts', async (req, res, next) => {
  try {
    const debts = await getDebts();
    
    res.json({
      success: true,
      data: debts,
      count: debts.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /debts/:id - Update debt
app.put('/debts/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid debt ID', 400);
    }
    
    const success = await updateDebt(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Debt updated successfully'
      });
    } else {
      throw new CustomError('Failed to update debt', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /debts/:id - Delete debt
app.delete('/debts/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid debt ID', 400);
    }
    
    const success = await deleteDebt(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Debt deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete debt', 500);
    }
  } catch (error) {
    next(error);
  }
});

// POST /debts/:id/payments - Add debt payment
app.post('/debts/:id/payments', validateRequest(debtPaymentSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid debt ID', 400);
    }
    
    const { amount, paymentDate, isExtraPayment, notes } = req.body;
    
    const success = await addDebtPayment(id, amount, paymentDate, isExtraPayment, notes);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Debt payment recorded successfully',
        data: { debtId: id, amount, paymentDate, isExtraPayment, notes }
      });
    } else {
      throw new CustomError('Failed to record debt payment', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /debts/:id/payments - Get debt payments
app.get('/debts/:id/payments', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid debt ID', 400);
    }
    
    const payments = await getDebtPayments(id);
    
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /debts/summary - Get debt summary
app.get('/debts/summary', async (req, res, next) => {
  try {
    const summary = await getDebtSummary();
    
    if (summary) {
      res.json({
        success: true,
        data: summary
      });
    } else {
      throw new CustomError('Failed to generate debt summary', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FINANCIAL GOALS ENDPOINTS
// ============================================================================

// POST /goals - Create financial goal
app.post('/goals', validateRequest(createFinancialGoalSchema), async (req, res, next) => {
  try {
    const { name, type, targetAmount, targetDate, priority, monthlyContribution, notes } = req.body;
    
    const success = await createFinancialGoal(name, type, targetAmount, targetDate, priority, monthlyContribution, notes);
    
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Financial goal created successfully',
        data: { name, type, targetAmount, targetDate, priority, monthlyContribution, notes }
      });
    } else {
      throw new CustomError('Failed to create financial goal', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /goals - List financial goals
app.get('/goals', async (req, res, next) => {
  try {
    const goals = await getFinancialGoals();
    
    res.json({
      success: true,
      data: goals,
      count: goals.length
    });
  } catch (error) {
    next(error);
  }
});

// PUT /goals/:id - Update financial goal
app.put('/goals/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid goal ID', 400);
    }
    
    const success = await updateFinancialGoal(id, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Financial goal updated successfully'
      });
    } else {
      throw new CustomError('Failed to update financial goal', 500);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /goals/:id - Delete financial goal
app.delete('/goals/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid goal ID', 400);
    }
    
    const success = await deleteFinancialGoal(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Financial goal deleted successfully'
      });
    } else {
      throw new CustomError('Failed to delete financial goal', 500);
    }
  } catch (error) {
    next(error);
  }
});

// POST /goals/:id/contribute - Add contribution to goal
app.post('/goals/:id/contribute', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('Invalid goal ID', 400);
    }
    
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      throw new CustomError('Valid contribution amount is required', 400);
    }
    
    const success = await addToFinancialGoal(id, amount);
    
    if (success) {
      res.json({
        success: true,
        message: `$${amount} contributed to financial goal`
      });
    } else {
      throw new CustomError('Failed to add contribution', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RECURRING BUDGET ALERTS
// ============================================================================

// POST /alerts/recurring-budget - Check recurring budget alerts
app.post('/alerts/recurring-budget', async (req, res, next) => {
  try {
    const alerts = await checkRecurringBudgetAlerts();
    
    res.json({
      success: true,
      message: `Generated ${alerts.length} recurring budget alerts`,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SUMMARY ENDPOINTS
// ============================================================================

// GET /summary - Financial summary
app.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {
      startDate: startDate && startDate !== '' ? startDate as string : undefined,
      endDate: endDate && endDate !== '' ? endDate as string : undefined
    };
    
    const summary = await getFinancialSummary(filters);
    
    if (summary) {
      res.json({
        success: true,
        data: summary,
        filters
      });
    } else {
      throw new CustomError('Failed to generate financial summary', 500);
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// POST /admin/sync - Force sync data
app.post('/admin/sync', async (req, res, next) => {
  try {
    const success = await syncFinanceData();
    
    if (success) {
      res.json({
        success: true,
        message: 'Data synchronization completed successfully'
      });
    } else {
      throw new CustomError('Data synchronization failed', 500);
    }
  } catch (error) {
    next(error);
  }
});

// GET /admin/sync-status - Get sync status
app.get('/admin/sync-status', async (req, res, next) => {
  try {
    const status = await getSyncStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/populate-demo - Populate demo data
app.post('/admin/populate-demo', async (req, res, next) => {
  try {
    await populateFinanceDemoData();
    
    res.json({
      success: true,
      message: 'Demo data populated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /admin/audit-log - Get audit log
app.get('/admin/audit-log', async (req, res, next) => {
  try {
    const { table, limit } = req.query;
    const auditLog = await getAuditLog(table as string, parseInt(limit as string) || 100);
    
    res.json({
      success: true,
      data: auditLog,
      count: auditLog.length
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// ============================================================================
// ERROR HANDLER (must be last)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Setup database
    console.log('🏗️  Setting up finance database...');
    await setupFinanceDatabase();
    console.log('✅ Database setup complete');
    
    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Finance API Server started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log('─'.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}

export { app, startServer };
