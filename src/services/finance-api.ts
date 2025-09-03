import type {
  TApiResponse,
  TApiListResponse,
  TCategory,
  TTransaction,
  TSavingsGoal,
  TBudget,
  TRecurringTransaction,
  TTag,
  TAlert,
  TDebt,
  TDebtPayment,
  TFinancialGoal,
  TFinancialSummary,
  TFinancialForecast
} from '../types/finance';

class FinanceAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories(type?: 'income' | 'expense'): Promise<TApiListResponse<TCategory>> {
    const params = type ? `?type=${type}` : '';
    return this.request(`/categories${params}`);
  }

  async createCategory(data: Omit<TCategory, 'id' | 'created_at' | 'updated_at'>): Promise<TApiResponse<TCategory>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<TCategory>): Promise<TApiResponse<TCategory>> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<TApiResponse<void>> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    type?: 'income' | 'expense';
    limit?: number;
  }): Promise<TApiListResponse<TTransaction>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async createTransaction(data: {
    amount: number;
    type: 'income' | 'expense';
    categoryId: number;
    note?: string;
    date?: string;
  }): Promise<TApiResponse<TTransaction>> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: number, data: Partial<TTransaction>): Promise<TApiResponse<TTransaction>> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number): Promise<TApiResponse<void>> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  async getSummary(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TApiResponse<TFinancialSummary>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return this.request(`/summary${queryString ? `?${queryString}` : ''}`);
  }

  // ============================================================================
  // SAVINGS GOALS
  // ============================================================================

  async getSavingsGoals(): Promise<TApiListResponse<TSavingsGoal>> {
    return this.request('/savings');
  }

  async createSavingsGoal(
    name: string, 
    targetAmount: number, 
    deadline?: string,
    description?: string,
    color?: string,
    icon?: string
  ): Promise<TApiResponse<TSavingsGoal>> {
    return this.request('/savings', {
      method: 'POST',
      body: JSON.stringify({ name, targetAmount, deadline, description, color, icon }),
    });
  }

  async updateSavingsGoal(id: number, data: Partial<TSavingsGoal>): Promise<TApiResponse<TSavingsGoal>> {
    return this.request(`/savings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSavingsGoal(id: number): Promise<TApiResponse<void>> {
    return this.request(`/savings/${id}`, {
      method: 'DELETE',
    });
  }

  async addSavingsTransaction(
    goalId: number,
    amount: number,
    type: 'deposit' | 'withdrawal',
    note?: string,
    date?: string
  ): Promise<TApiResponse<TSavingsGoal>> {
    return this.request(`/savings/${goalId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ amount, type, note, date }),
    });
  }

  async getSavingsTransactions(goalId: number): Promise<TApiListResponse<any>> {
    return this.request(`/savings/${goalId}/transactions`);
  }

  // ============================================================================
  // BUDGETS
  // ============================================================================

  async getBudgets(): Promise<TApiListResponse<TBudget>> {
    return this.request('/budgets');
  }

  async createBudget(data: {
    categoryId: number;
    amount: number;
    period: 'monthly' | 'yearly';
    startDate: string;
    endDate?: string;
  }): Promise<TApiResponse<TBudget>> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: number, data: Partial<TBudget>): Promise<TApiResponse<TBudget>> {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: number): Promise<TApiResponse<void>> {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  async getBudgetVsActual(budgetId: number): Promise<TApiResponse<any>> {
    return this.request(`/budgets/${budgetId}/vs-actual`);
  }

  // ============================================================================
  // RECURRING TRANSACTIONS
  // ============================================================================

  async getRecurringTransactions(): Promise<TApiListResponse<TRecurringTransaction>> {
    return this.request('/recurring');
  }

  async createRecurringTransaction(data: {
    name: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId: number;
    recurrenceRule: 'weekly' | 'monthly' | 'yearly';
    nextDueDate: string;
    note?: string;
  }): Promise<TApiResponse<TRecurringTransaction>> {
    return this.request('/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecurringTransaction(id: number, data: Partial<TRecurringTransaction>): Promise<TApiResponse<TRecurringTransaction>> {
    return this.request(`/recurring/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurringTransaction(id: number): Promise<TApiResponse<void>> {
    return this.request(`/recurring/${id}`, {
      method: 'DELETE',
    });
  }

  async generateRecurringTransactions(): Promise<TApiResponse<any>> {
    return this.request('/recurring/generate', { method: 'POST' });
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  async getTags(): Promise<TApiListResponse<TTag>> {
    return this.request('/tags');
  }

  async createTag(data: {
    name: string;
    color: string;
    description?: string;
  }): Promise<TApiResponse<TTag>> {
    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: number, data: Partial<TTag>): Promise<TApiResponse<TTag>> {
    return this.request(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: number): Promise<TApiResponse<void>> {
    return this.request(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  async addTagsToTransaction(transactionId: number, tagIds: number[]): Promise<TApiResponse<any>> {
    return this.request(`/transactions/${transactionId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagIds }),
    });
  }

  async removeTagsFromTransaction(transactionId: number, tagIds: number[]): Promise<TApiResponse<any>> {
    return this.request(`/transactions/${transactionId}/tags`, {
      method: 'DELETE',
      body: JSON.stringify({ tagIds }),
    });
  }

  async getTransactionTags(transactionId: number): Promise<TApiListResponse<TTag>> {
    return this.request(`/transactions/${transactionId}/tags`);
  }

  // ============================================================================
  // ALERTS
  // ============================================================================

  async getAlerts(filters?: {
    isRead?: boolean;
    isDismissed?: boolean;
    type?: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom';
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<TApiListResponse<TAlert>> {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.isDismissed !== undefined) params.append('isDismissed', filters.isDismissed.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.severity) params.append('severity', filters.severity);

    const queryString = params.toString();
    return this.request(`/alerts${queryString ? `?${queryString}` : ''}`);
  }

  async markAlertAsRead(id: number): Promise<TApiResponse<TAlert>> {
    return this.request(`/alerts/${id}/read`, { method: 'POST' });
  }

  async dismissAlert(id: number): Promise<TApiResponse<void>> {
    return this.request(`/alerts/${id}/dismiss`, { method: 'POST' });
  }

  async deleteAlert(id: number): Promise<TApiResponse<void>> {
    return this.request(`/alerts/${id}`, { method: 'DELETE' });
  }

  async createAlert(data: {
    type: 'budget_warning' | 'recurring_due' | 'savings_deadline' | 'custom';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
    relatedId?: number;
    relatedType?: string;
  }): Promise<TApiResponse<TAlert>> {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateAllAlerts(): Promise<TApiResponse<any>> {
    return this.request('/alerts/generate', { method: 'POST' });
  }

  // ============================================================================
  // DEBTS
  // ============================================================================

  async getDebts(): Promise<TApiListResponse<TDebt>> {
    return this.request('/debts');
  }

  async createDebt(data: {
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
  }): Promise<TApiResponse<TDebt>> {
    return this.request('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDebt(id: number, data: Partial<TDebt>): Promise<TApiResponse<TDebt>> {
    return this.request(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDebt(id: number): Promise<TApiResponse<void>> {
    return this.request(`/debts/${id}`, {
      method: 'DELETE',
    });
  }

  async addDebtPayment(debtId: number, data: {
    amount: number;
    paymentDate: string;
    isExtraPayment?: boolean;
    notes?: string;
  }): Promise<TApiResponse<TDebtPayment>> {
    return this.request(`/debts/${debtId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDebtPayments(debtId: number): Promise<TApiListResponse<TDebtPayment>> {
    return this.request(`/debts/${debtId}/payments`);
  }

  async getDebtSummary(): Promise<TApiResponse<any>> {
    return this.request('/debts/summary');
  }

  // ============================================================================
  // FINANCIAL GOALS
  // ============================================================================

  async getFinancialGoals(): Promise<TApiListResponse<TFinancialGoal>> {
    return this.request('/goals');
  }

  async createFinancialGoal(data: {
    name: string;
    type: string;
    targetAmount: number;
    targetDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    monthlyContribution?: number;
    notes?: string;
  }): Promise<TApiResponse<TFinancialGoal>> {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFinancialGoal(id: number, data: Partial<TFinancialGoal>): Promise<TApiResponse<TFinancialGoal>> {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFinancialGoal(id: number): Promise<TApiResponse<void>> {
    return this.request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // ADVANCED ANALYTICS
  // ============================================================================
  
  async getFinancialForecast(months: number = 6): Promise<TApiResponse<TFinancialForecast>> {
    return this.request(`/analytics/forecast?months=${months}`);
  }

  async getTrendAnalysis(period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<TApiResponse<any>> {
    return this.request(`/analytics/trends?period=${period}`);
  }

  async getCategoryBreakdown(startDate?: string, endDate?: string): Promise<TApiResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    return this.request(`/analytics/categories${queryString ? `?${queryString}` : ''}`);
  }

  // ============================================================================
  // SYSTEM & SYNCHRONIZATION
  // ============================================================================

  async syncFinanceData(): Promise<TApiResponse<any>> {
    return this.request('/admin/sync', { method: 'POST' });
  }

  async getSyncStatus(): Promise<TApiResponse<any>> {
    return this.request('/admin/sync-status');
  }

  async getAuditLog(limit: number = 50): Promise<TApiListResponse<any>> {
    return this.request(`/admin/audit-log?limit=${limit}`);
  }

  async populateDemo(): Promise<TApiResponse<any>> {
    return this.request('/admin/populate-demo', { method: 'POST' });
  }
}

export const api = new FinanceAPI();
