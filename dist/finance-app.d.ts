declare function setupFinanceDatabase(): Promise<void>;
declare function createCategory(name: string, type: 'income' | 'expense', color?: string, icon?: string): Promise<boolean>;
declare function getCategories(type?: 'income' | 'expense'): Promise<import("@libsql/client").Row[]>;
declare function updateCategory(id: number, updates: {
    name?: string;
    type?: 'income' | 'expense';
    color?: string;
    icon?: string;
}): Promise<boolean>;
declare function deleteCategory(id: number): Promise<boolean>;
declare function createTransaction(amount: number, type: 'income' | 'expense', categoryId: number, note?: string, date?: string): Promise<boolean>;
declare function getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    type?: 'income' | 'expense';
    limit?: number;
}): Promise<import("@libsql/client").Row[]>;
declare function updateTransaction(id: number, updates: {
    amount?: number;
    type?: 'income' | 'expense';
    categoryId?: number;
    note?: string;
    date?: string;
}): Promise<boolean>;
declare function deleteTransaction(id: number): Promise<boolean>;
declare function getDashboardData(currency?: string): Promise<{
    currency: string;
    monthly: {
        income: any;
        expense: any;
        net: number;
        savingsRate: number;
    };
    budgets: {
        total: any;
        actual: any;
        remaining: number;
        warnings: number;
        critical: number;
    };
    savings: {
        target: any;
        progress: any;
        overallProgress: number;
        activeGoals: number;
        completedGoals: number;
    };
    recurring: {
        total: number;
        upcoming: number;
        dueThisWeek: number;
    };
    alerts: {
        total: number;
        critical: number;
        high: number;
        unread: number;
    };
    quickActions: {
        needsAttention: number;
        canGenerateRecurring: number;
    };
}>;
declare function getFinancialSummary(filters?: {
    startDate?: string;
    endDate?: string;
}): Promise<{
    overall: {
        totalIncome: import("@libsql/client").Value;
        totalExpense: import("@libsql/client").Value;
        netIncome: number;
        totalTransactions: import("@libsql/client").Value;
        totalSavingsTarget: any;
        totalSavingsProgress: any;
        totalSavingsRemaining: number;
        totalBudget: any;
        totalActual: any;
        budgetRemaining: number;
    };
    monthly: import("@libsql/client").Row[];
    categories: any[];
    recentTransactions: import("@libsql/client").Row[];
    savings: {
        goals: any[];
        summary: {
            totalGoals: number;
            completedGoals: number;
            totalTarget: any;
            totalProgress: any;
            totalRemaining: number;
            overallProgress: number;
        };
    };
    budgets: {
        overview: import("@libsql/client").Row[];
        summary: {
            totalBudget: any;
            totalActual: any;
            budgetRemaining: number;
            percentageUsed: number;
        };
    };
    analytics: {
        trends: {
            currentMonth: {
                income: any;
                expense: any;
            };
            previousMonth: {
                income: any;
                expense: any;
            };
            incomeGrowth: number;
            expenseGrowth: number;
        };
        averages: {
            spendPerCategory: any[];
            savingsRate: number;
        };
    };
}>;
declare function createBudget(categoryId: number, amount: number, period: 'monthly' | 'yearly', startDate: string, endDate?: string): Promise<boolean>;
declare function getBudgets(): Promise<import("@libsql/client").Row[]>;
declare function updateBudget(id: number, updates: {
    amount?: number;
    period?: 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}): Promise<boolean>;
declare function deleteBudget(id: number): Promise<boolean>;
declare function getBudgetVsActual(categoryId?: number, month?: string): Promise<import("@libsql/client").Row[]>;
declare function createRecurringTransaction(name: string, amount: number, type: 'income' | 'expense', categoryId: number, recurrenceRule: 'weekly' | 'monthly' | 'yearly', nextDueDate: string, note?: string): Promise<boolean>;
declare function getRecurringTransactions(): Promise<import("@libsql/client").Row[]>;
declare function updateRecurringTransaction(id: number, updates: any): Promise<boolean>;
declare function deleteRecurringTransaction(id: number): Promise<boolean>;
declare function generateRecurringTransactions(): Promise<number>;
declare function createAlert(type: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom', title: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical', dueDate?: string, relatedId?: number, relatedType?: string): Promise<boolean>;
declare function getAlerts(filters?: {
    isRead?: boolean;
    isDismissed?: boolean;
    type?: string;
    severity?: string;
}): Promise<import("@libsql/client").Row[]>;
declare function markAlertAsRead(id: number): Promise<boolean>;
declare function dismissAlert(id: number): Promise<boolean>;
declare function deleteAlert(id: number): Promise<boolean>;
declare function generateAllAlerts(): Promise<{
    budgetWarnings: any[];
    recurringReminders: any[];
    savingsReminders: any[];
    total: number;
}>;
declare function generateFinancialForecast(months?: number, currency?: string): Promise<{
    currency: string;
    months: number;
    projectedIncome: any[];
    projectedExpenses: any[];
    projectedSavings: any[];
    projectedBalances: any[];
    cashFlow: any[];
    trends: {
        incomeGrowth: number;
        expenseGrowth: number;
        savingsRate: number;
    };
}>;
declare function setDefaultCurrency(currency: string): Promise<boolean>;
declare function getDefaultCurrency(): Promise<string>;
declare function updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): Promise<boolean>;
declare function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number>;
declare function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
declare function populateDefaultExchangeRates(): Promise<boolean>;
declare function createDebt(name: string, type: 'loan' | 'credit_card' | 'mortgage' | 'personal_debt' | 'other', originalAmount: number, currentBalance: number, interestRate: number, minimumPayment: number, paymentFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly', startDate: string, endDate?: string, notes?: string): Promise<boolean>;
declare function getDebts(): Promise<import("@libsql/client").Row[]>;
declare function updateDebt(id: number, updates: any): Promise<boolean>;
declare function deleteDebt(id: number): Promise<boolean>;
declare function addDebtPayment(debtId: number, amount: number, paymentDate: string, isExtraPayment?: boolean, notes?: string): Promise<boolean>;
declare function getDebtPayments(debtId: number): Promise<import("@libsql/client").Row[]>;
declare function getDebtSummary(): Promise<{
    totalDebts: number;
    totalBalance: any;
    totalOriginal: any;
    totalPaid: any;
    totalInterest: any;
    averageInterestRate: number;
    monthlyPayments: any;
    byType: any;
}>;
declare function createFinancialGoal(name: string, type: string, targetAmount: number, targetDate?: string, priority?: 'low' | 'medium' | 'high' | 'critical', monthlyContribution?: number, notes?: string): Promise<boolean>;
declare function getFinancialGoals(): Promise<import("@libsql/client").Row[]>;
declare function updateFinancialGoal(id: number, updates: any): Promise<boolean>;
declare function deleteFinancialGoal(id: number): Promise<boolean>;
declare function addToFinancialGoal(id: number, amount: number): Promise<boolean>;
declare function checkRecurringBudgetAlerts(): Promise<any[]>;
declare function createTag(name: string, color?: string, description?: string): Promise<boolean>;
declare function getTags(): Promise<import("@libsql/client").Row[]>;
declare function updateTag(id: number, updates: {
    name?: string;
    color?: string;
    description?: string;
}): Promise<boolean>;
declare function deleteTag(id: number): Promise<boolean>;
declare function addTagsToTransaction(transactionId: number, tagIds: number[]): Promise<boolean>;
declare function removeTagsFromTransaction(transactionId: number, tagIds: number[]): Promise<boolean>;
declare function getTransactionTags(transactionId: number): Promise<import("@libsql/client").Row[]>;
declare function createSavingsGoal(name: string, targetAmount: number, deadline?: string, description?: string, color?: string, icon?: string): Promise<boolean>;
declare function getSavingsGoals(): Promise<any[]>;
declare function updateSavingsGoal(id: number, updates: {
    name?: string;
    targetAmount?: number;
    deadline?: string;
    description?: string;
    color?: string;
    icon?: string;
    currentAmount?: number;
}): Promise<boolean>;
declare function deleteSavingsGoal(id: number): Promise<boolean>;
declare function addSavingsTransaction(goalId: number, amount: number, type: 'deposit' | 'withdrawal', note?: string, date?: string): Promise<boolean>;
declare function getSavingsTransactions(goalId?: number): Promise<import("@libsql/client").Row[]>;
declare function logAuditAction(action: string, tableName: string, recordId?: number, oldValues?: string, newValues?: string): Promise<void>;
declare function getAuditLog(tableName?: string, limit?: number): Promise<import("@libsql/client").Row[]>;
declare function syncFinanceData(): Promise<boolean>;
declare function getSyncStatus(): Promise<any>;
declare function populateFinanceDemoData(): Promise<void>;
export { setupFinanceDatabase, createCategory, getCategories, updateCategory, deleteCategory, createTransaction, getTransactions, updateTransaction, deleteTransaction, createSavingsGoal, getSavingsGoals, updateSavingsGoal, deleteSavingsGoal, addSavingsTransaction, getSavingsTransactions, createBudget, getBudgets, updateBudget, deleteBudget, getBudgetVsActual, createRecurringTransaction, getRecurringTransactions, updateRecurringTransaction, deleteRecurringTransaction, generateRecurringTransactions, createTag, getTags, updateTag, deleteTag, addTagsToTransaction, removeTagsFromTransaction, getTransactionTags, createAlert, getAlerts, markAlertAsRead, dismissAlert, deleteAlert, generateAllAlerts, setDefaultCurrency, getDefaultCurrency, updateExchangeRate, getExchangeRate, convertCurrency, populateDefaultExchangeRates, generateFinancialForecast, createDebt, getDebts, updateDebt, deleteDebt, addDebtPayment, getDebtPayments, getDebtSummary, createFinancialGoal, getFinancialGoals, updateFinancialGoal, deleteFinancialGoal, addToFinancialGoal, checkRecurringBudgetAlerts, getDashboardData, getFinancialSummary, logAuditAction, getAuditLog, syncFinanceData, getSyncStatus, populateFinanceDemoData };
//# sourceMappingURL=finance-app.d.ts.map