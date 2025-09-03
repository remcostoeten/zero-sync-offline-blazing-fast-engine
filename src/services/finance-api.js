class FinanceAPI {
    baseURL;
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    }
    async request(endpoint, options) {
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
    async getCategories(type) {
        const params = type ? `?type=${type}` : '';
        return this.request(`/categories${params}`);
    }
    async createCategory(data) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateCategory(id, data) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteCategory(id) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE',
        });
    }
    // ============================================================================
    // TRANSACTIONS
    // ============================================================================
    async getTransactions(filters) {
        const params = new URLSearchParams();
        if (filters?.startDate)
            params.append('startDate', filters.startDate);
        if (filters?.endDate)
            params.append('endDate', filters.endDate);
        if (filters?.categoryId)
            params.append('categoryId', filters.categoryId.toString());
        if (filters?.type)
            params.append('type', filters.type);
        if (filters?.limit)
            params.append('limit', filters.limit.toString());
        const queryString = params.toString();
        return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
    }
    async createTransaction(data) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateTransaction(id, data) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE',
        });
    }
    // ============================================================================
    // SUMMARY
    // ============================================================================
    async getSummary(filters) {
        const params = new URLSearchParams();
        if (filters?.startDate)
            params.append('startDate', filters.startDate);
        if (filters?.endDate)
            params.append('endDate', filters.endDate);
        const queryString = params.toString();
        return this.request(`/summary${queryString ? `?${queryString}` : ''}`);
    }
    // ============================================================================
    // SAVINGS GOALS
    // ============================================================================
    async getSavingsGoals() {
        return this.request('/savings');
    }
    async createSavingsGoal(name, targetAmount, deadline, description, color, icon) {
        return this.request('/savings', {
            method: 'POST',
            body: JSON.stringify({ name, targetAmount, deadline, description, color, icon }),
        });
    }
    async updateSavingsGoal(id, data) {
        return this.request(`/savings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteSavingsGoal(id) {
        return this.request(`/savings/${id}`, {
            method: 'DELETE',
        });
    }
    async addSavingsTransaction(goalId, amount, type, note, date) {
        return this.request(`/savings/${goalId}/transactions`, {
            method: 'POST',
            body: JSON.stringify({ amount, type, note, date }),
        });
    }
    async getSavingsTransactions(goalId) {
        return this.request(`/savings/${goalId}/transactions`);
    }
    // ============================================================================
    // BUDGETS
    // ============================================================================
    async getBudgets() {
        return this.request('/budgets');
    }
    async createBudget(data) {
        return this.request('/budgets', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateBudget(id, data) {
        return this.request(`/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteBudget(id) {
        return this.request(`/budgets/${id}`, {
            method: 'DELETE',
        });
    }
    async getBudgetVsActual(budgetId) {
        return this.request(`/budgets/${budgetId}/vs-actual`);
    }
    // ============================================================================
    // RECURRING TRANSACTIONS
    // ============================================================================
    async getRecurringTransactions() {
        return this.request('/recurring');
    }
    async createRecurringTransaction(data) {
        return this.request('/recurring', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateRecurringTransaction(id, data) {
        return this.request(`/recurring/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteRecurringTransaction(id) {
        return this.request(`/recurring/${id}`, {
            method: 'DELETE',
        });
    }
    async generateRecurringTransactions() {
        return this.request('/recurring/generate', { method: 'POST' });
    }
    // ============================================================================
    // TAGS
    // ============================================================================
    async getTags() {
        return this.request('/tags');
    }
    async createTag(data) {
        return this.request('/tags', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateTag(id, data) {
        return this.request(`/tags/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteTag(id) {
        return this.request(`/tags/${id}`, {
            method: 'DELETE',
        });
    }
    async addTagsToTransaction(transactionId, tagIds) {
        return this.request(`/transactions/${transactionId}/tags`, {
            method: 'POST',
            body: JSON.stringify({ tagIds }),
        });
    }
    async removeTagsFromTransaction(transactionId, tagIds) {
        return this.request(`/transactions/${transactionId}/tags`, {
            method: 'DELETE',
            body: JSON.stringify({ tagIds }),
        });
    }
    async getTransactionTags(transactionId) {
        return this.request(`/transactions/${transactionId}/tags`);
    }
    // ============================================================================
    // ALERTS
    // ============================================================================
    async getAlerts(filters) {
        const params = new URLSearchParams();
        if (filters?.isRead !== undefined)
            params.append('isRead', filters.isRead.toString());
        if (filters?.isDismissed !== undefined)
            params.append('isDismissed', filters.isDismissed.toString());
        if (filters?.type)
            params.append('type', filters.type);
        if (filters?.severity)
            params.append('severity', filters.severity);
        const queryString = params.toString();
        return this.request(`/alerts${queryString ? `?${queryString}` : ''}`);
    }
    async markAlertAsRead(id) {
        return this.request(`/alerts/${id}/read`, { method: 'POST' });
    }
    async dismissAlert(id) {
        return this.request(`/alerts/${id}/dismiss`, { method: 'POST' });
    }
    async deleteAlert(id) {
        return this.request(`/alerts/${id}`, { method: 'DELETE' });
    }
    async createAlert(data) {
        return this.request('/alerts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async generateAllAlerts() {
        return this.request('/alerts/generate', { method: 'POST' });
    }
    // ============================================================================
    // DEBTS
    // ============================================================================
    async getDebts() {
        return this.request('/debts');
    }
    async createDebt(data) {
        return this.request('/debts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateDebt(id, data) {
        return this.request(`/debts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteDebt(id) {
        return this.request(`/debts/${id}`, {
            method: 'DELETE',
        });
    }
    async addDebtPayment(debtId, data) {
        return this.request(`/debts/${debtId}/payments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async getDebtPayments(debtId) {
        return this.request(`/debts/${debtId}/payments`);
    }
    async getDebtSummary() {
        return this.request('/debts/summary');
    }
    // ============================================================================
    // FINANCIAL GOALS
    // ============================================================================
    async getFinancialGoals() {
        return this.request('/goals');
    }
    async createFinancialGoal(data) {
        return this.request('/goals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateFinancialGoal(id, data) {
        return this.request(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteFinancialGoal(id) {
        return this.request(`/goals/${id}`, {
            method: 'DELETE',
        });
    }
    // ============================================================================
    // ADVANCED ANALYTICS
    // ============================================================================
    async getFinancialForecast(months = 6) {
        return this.request(`/analytics/forecast?months=${months}`);
    }
    async getTrendAnalysis(period = 'monthly') {
        return this.request(`/analytics/trends?period=${period}`);
    }
    async getCategoryBreakdown(startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate)
            params.append('startDate', startDate);
        if (endDate)
            params.append('endDate', endDate);
        const queryString = params.toString();
        return this.request(`/analytics/categories${queryString ? `?${queryString}` : ''}`);
    }
    // ============================================================================
    // SYSTEM & SYNCHRONIZATION
    // ============================================================================
    async syncFinanceData() {
        return this.request('/admin/sync', { method: 'POST' });
    }
    async getSyncStatus() {
        return this.request('/admin/sync-status');
    }
    async getAuditLog(limit = 50) {
        return this.request(`/admin/audit-log?limit=${limit}`);
    }
    async populateDemo() {
        return this.request('/admin/populate-demo', { method: 'POST' });
    }
}
export const api = new FinanceAPI();
//# sourceMappingURL=finance-api.js.map