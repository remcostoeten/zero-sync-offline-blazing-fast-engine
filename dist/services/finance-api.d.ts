import type { TApiResponse, TApiListResponse, TCategory, TTransaction, TSavingsGoal, TBudget, TRecurringTransaction, TTag, TAlert, TDebt, TDebtPayment, TFinancialGoal, TFinancialSummary, TFinancialForecast } from '../types/finance';
declare class FinanceAPI {
    private baseURL;
    constructor();
    private request;
    getCategories(type?: 'income' | 'expense'): Promise<TApiListResponse<TCategory>>;
    createCategory(data: Omit<TCategory, 'id' | 'created_at' | 'updated_at'>): Promise<TApiResponse<TCategory>>;
    updateCategory(id: number, data: Partial<TCategory>): Promise<TApiResponse<TCategory>>;
    deleteCategory(id: number): Promise<TApiResponse<void>>;
    getTransactions(filters?: {
        startDate?: string;
        endDate?: string;
        categoryId?: number;
        type?: 'income' | 'expense';
        limit?: number;
    }): Promise<TApiListResponse<TTransaction>>;
    createTransaction(data: {
        amount: number;
        type: 'income' | 'expense';
        categoryId: number;
        note?: string;
        date?: string;
    }): Promise<TApiResponse<TTransaction>>;
    updateTransaction(id: number, data: Partial<TTransaction>): Promise<TApiResponse<TTransaction>>;
    deleteTransaction(id: number): Promise<TApiResponse<void>>;
    getSummary(filters?: {
        startDate?: string;
        endDate?: string;
    }): Promise<TApiResponse<TFinancialSummary>>;
    getSavingsGoals(): Promise<TApiListResponse<TSavingsGoal>>;
    createSavingsGoal(name: string, targetAmount: number, deadline?: string, description?: string, color?: string, icon?: string): Promise<TApiResponse<TSavingsGoal>>;
    updateSavingsGoal(id: number, data: Partial<TSavingsGoal>): Promise<TApiResponse<TSavingsGoal>>;
    deleteSavingsGoal(id: number): Promise<TApiResponse<void>>;
    addSavingsTransaction(goalId: number, amount: number, type: 'deposit' | 'withdrawal', note?: string, date?: string): Promise<TApiResponse<TSavingsGoal>>;
    getSavingsTransactions(goalId: number): Promise<TApiListResponse<any>>;
    getBudgets(): Promise<TApiListResponse<TBudget>>;
    createBudget(data: {
        categoryId: number;
        amount: number;
        period: 'monthly' | 'yearly';
        startDate: string;
        endDate?: string;
    }): Promise<TApiResponse<TBudget>>;
    updateBudget(id: number, data: Partial<TBudget>): Promise<TApiResponse<TBudget>>;
    deleteBudget(id: number): Promise<TApiResponse<void>>;
    getBudgetVsActual(budgetId: number): Promise<TApiResponse<any>>;
    getRecurringTransactions(): Promise<TApiListResponse<TRecurringTransaction>>;
    createRecurringTransaction(data: {
        name: string;
        amount: number;
        type: 'income' | 'expense';
        categoryId: number;
        recurrenceRule: 'weekly' | 'monthly' | 'yearly';
        nextDueDate: string;
        note?: string;
    }): Promise<TApiResponse<TRecurringTransaction>>;
    updateRecurringTransaction(id: number, data: Partial<TRecurringTransaction>): Promise<TApiResponse<TRecurringTransaction>>;
    deleteRecurringTransaction(id: number): Promise<TApiResponse<void>>;
    generateRecurringTransactions(): Promise<TApiResponse<any>>;
    getTags(): Promise<TApiListResponse<TTag>>;
    createTag(data: {
        name: string;
        color: string;
        description?: string;
    }): Promise<TApiResponse<TTag>>;
    updateTag(id: number, data: Partial<TTag>): Promise<TApiResponse<TTag>>;
    deleteTag(id: number): Promise<TApiResponse<void>>;
    addTagsToTransaction(transactionId: number, tagIds: number[]): Promise<TApiResponse<any>>;
    removeTagsFromTransaction(transactionId: number, tagIds: number[]): Promise<TApiResponse<any>>;
    getTransactionTags(transactionId: number): Promise<TApiListResponse<TTag>>;
    getAlerts(filters?: {
        isRead?: boolean;
        isDismissed?: boolean;
        type?: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom';
        severity?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<TApiListResponse<TAlert>>;
    markAlertAsRead(id: number): Promise<TApiResponse<TAlert>>;
    dismissAlert(id: number): Promise<TApiResponse<void>>;
    deleteAlert(id: number): Promise<TApiResponse<void>>;
    createAlert(data: {
        type: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom';
        title: string;
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        dueDate?: string;
        relatedId?: number;
        relatedType?: string;
    }): Promise<TApiResponse<TAlert>>;
    generateAllAlerts(): Promise<TApiResponse<any>>;
    getDebts(): Promise<TApiListResponse<TDebt>>;
    createDebt(data: {
        name: string;
        type: 'loan' | 'credit_card' | 'mortgage' | 'personal_debt' | 'other';
        originalAmount: number;
        currentBalance: number;
        interestRate: number;
        minimumPayment: number;
        paymentFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
        startDate: string;
        endDate?: string;
        notes?: string;
    }): Promise<TApiResponse<TDebt>>;
    updateDebt(id: number, data: Partial<TDebt>): Promise<TApiResponse<TDebt>>;
    deleteDebt(id: number): Promise<TApiResponse<void>>;
    addDebtPayment(debtId: number, data: {
        amount: number;
        paymentDate: string;
        isExtraPayment?: boolean;
        notes?: string;
    }): Promise<TApiResponse<TDebtPayment>>;
    getDebtPayments(debtId: number): Promise<TApiListResponse<TDebtPayment>>;
    getDebtSummary(): Promise<TApiResponse<any>>;
    getFinancialGoals(): Promise<TApiListResponse<TFinancialGoal>>;
    createFinancialGoal(data: {
        name: string;
        type: string;
        targetAmount: number;
        targetDate?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        monthlyContribution?: number;
        notes?: string;
    }): Promise<TApiResponse<TFinancialGoal>>;
    updateFinancialGoal(id: number, data: Partial<TFinancialGoal>): Promise<TApiResponse<TFinancialGoal>>;
    deleteFinancialGoal(id: number): Promise<TApiResponse<void>>;
    getFinancialForecast(months?: number): Promise<TApiResponse<TFinancialForecast>>;
    getTrendAnalysis(period?: 'monthly' | 'quarterly' | 'yearly'): Promise<TApiResponse<any>>;
    getCategoryBreakdown(startDate?: string, endDate?: string): Promise<TApiResponse<any>>;
    syncFinanceData(): Promise<TApiResponse<any>>;
    getSyncStatus(): Promise<TApiResponse<any>>;
    getAuditLog(limit?: number): Promise<TApiListResponse<any>>;
    populateDemo(): Promise<TApiResponse<any>>;
}
export declare const api: FinanceAPI;
export {};
//# sourceMappingURL=finance-api.d.ts.map