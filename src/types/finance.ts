// ============================================================================
// FINANCE APPLICATION TYPES
// ============================================================================

// Base entity type with timestamps
type TTimestamps = {
  created_at: string;
  updated_at: string;
};

type TBaseEntity = {
  id: number;
} & TTimestamps;

// ============================================================================
// CORE FINANCIAL ENTITIES
// ============================================================================

type TCategory = {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
} & TBaseEntity;

type TTransaction = {
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  note: string;
  date: string;
} & TBaseEntity;

type TSavingsGoal = {
  name: string;
  target_amount: number;
  deadline: string | null;
  description: string | null;
  color: string;
  icon: string;
  net_contribution: number;
  remaining: number;
  progress: number;
} & TBaseEntity;

// ============================================================================
// BUDGET MANAGEMENT TYPES
// ============================================================================

type TBudget = {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  status: 'on_track' | 'warning' | 'exceeded';
} & TBaseEntity;

type TBudgetVsActual = {
  budget_id: number;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  category_name: string;
  period: string;
};

// ============================================================================
// RECURRING TRANSACTIONS TYPES
// ============================================================================

type TRecurringTransaction = {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  recurrence_rule: 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  note: string | null;
  is_active: boolean;
  last_generated: string | null;
} & TBaseEntity;

// ============================================================================
// TAG SYSTEM TYPES
// ============================================================================

type TTag = {
  name: string;
  color: string;
  description: string | null;
  transaction_count: number;
} & TBaseEntity;

type TTransactionTag = {
  transaction_id: number;
  tag_id: number;
  tag_name: string;
  tag_color: string;
};

// ============================================================================
// ALERT SYSTEM TYPES
// ============================================================================

type TAlert = {
  type: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  is_dismissed: boolean;
  due_date: string | null;
  related_id: number | null;
  related_type: string | null;
} & TBaseEntity;

// ============================================================================
// CURRENCY TYPES
// ============================================================================

type TCurrency = {
  code: string; // e.g., 'USD', 'EUR'
  name: string; // e.g., 'US Dollar'
  symbol: string; // e.g., '$'
  is_default: boolean;
};

type TExchangeRate = {
  from_currency: string;
  to_currency: string;
  rate: number;
  last_updated: string;
};

// ============================================================================
// DEBT MANAGEMENT TYPES
// ============================================================================

type TDebt = {
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'personal_debt' | 'other';
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  notes: string | null;
  total_paid: number;
  total_interest_paid: number;
} & TBaseEntity;

type TDebtPayment = {
  debt_id: number;
  debt_name: string;
  amount: number;
  payment_date: string;
  is_extra_payment: boolean;
  notes: string | null;
  balance_after: number;
} & TBaseEntity;

type TDebtSummary = {
  total_debt: number;
  total_monthly_payments: number;
  total_interest_rate_weighted: number;
  debt_to_income_ratio: number;
  payoff_timeline_months: number;
  total_interest_if_minimum: number;
};

// ============================================================================
// FINANCIAL GOALS TYPES
// ============================================================================

type TFinancialGoal = {
  name: string;
  type: string; // e.g., 'retirement', 'emergency_fund', 'vacation'
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  monthly_contribution: number;
  progress_percentage: number;
  months_to_goal: number | null;
  notes: string | null;
} & TBaseEntity;

// ============================================================================
// ANALYTICS AND REPORTING TYPES
// ============================================================================

type TFinancialSummary = {
  overall: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    totalTransactions: number;
    totalSavingsProgress?: number;
    totalDebtBalance?: number;
    totalBudgetAmount?: number;
    totalGoalProgress?: number;
  };
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    transactions: number;
    net_income: number;
  }>;
  categories: Array<{
    id: number;
    name: string;
    type: string;
    color: string;
    icon: string;
    total_amount: number;
    transaction_count: number;
    budget_amount?: number;
    budget_remaining?: number;
  }>;
  recentTransactions: TTransaction[];
  savings?: {
    goals: TSavingsGoal[];
    total_target: number;
    total_progress: number;
    total_remaining: number;
  };
  debts?: {
    debts: TDebt[];
    total_balance: number;
    monthly_payments: number;
    payoff_timeline: number;
  };
  budgets?: {
    budgets: TBudget[];
    total_budgeted: number;
    total_spent: number;
    on_track_count: number;
    warning_count: number;
    exceeded_count: number;
  };
  goals?: {
    goals: TFinancialGoal[];
    total_target: number;
    total_current: number;
    average_progress: number;
  };
};

type TFinancialForecast = {
  months: number;
  currency: string;
  projections: Array<{
    month: string;
    projected_income: number;
    projected_expenses: number;
    projected_savings: number;
    cumulative_savings: number;
    confidence_level: number;
  }>;
  assumptions: {
    average_monthly_income: number;
    average_monthly_expenses: number;
    growth_rate: number;
    inflation_rate: number;
  };
  recommendations: string[];
};

type TTrendAnalysis = {
  period: 'monthly' | 'quarterly' | 'yearly';
  trends: Array<{
    category: string;
    growth_rate: number;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    seasonal_pattern: boolean;
  }>;
  insights: string[];
};

// ============================================================================
// FORM AND UI TYPES
// ============================================================================

type TBudgetFormData = {
  categoryId: string;
  amount: string;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
};

type TRecurringTransactionFormData = {
  name: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  recurrenceRule: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  note: string;
};

type TTagFormData = {
  name: string;
  color: string;
  description: string;
};

type TDebtFormData = {
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'personal_debt' | 'other';
  originalAmount: string;
  currentBalance: string;
  interestRate: string;
  minimumPayment: string;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  notes: string;
};

type TFinancialGoalFormData = {
  name: string;
  type: string;
  targetAmount: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  monthlyContribution: string;
  notes: string;
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

type TApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: unknown;
  };
};

type TApiListResponse<T> = TApiResponse<T[]>;

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

type TNavigationTab = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  badge?: number;
};

// Export all types
export type {
  // Base types
  TTimestamps,
  TBaseEntity,
  
  // Core financial entities
  TCategory,
  TTransaction,
  TSavingsGoal,
  
  // Advanced features
  TBudget,
  TBudgetVsActual,
  TRecurringTransaction,
  TTag,
  TTransactionTag,
  TAlert,
  TCurrency,
  TExchangeRate,
  TDebt,
  TDebtPayment,
  TDebtSummary,
  TFinancialGoal,
  
  // Analytics and reporting
  TFinancialSummary,
  TFinancialForecast,
  TTrendAnalysis,
  
  // Form types
  TBudgetFormData,
  TRecurringTransactionFormData,
  TTagFormData,
  TDebtFormData,
  TFinancialGoalFormData,
  
  // API types
  TApiResponse,
  TApiListResponse,
  
  // UI types
  TNavigationTab
};
