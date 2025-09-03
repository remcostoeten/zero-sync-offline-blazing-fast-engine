import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BudgetList } from '../components/finance/budgets/budget-list';
import { BudgetForm } from '../components/finance/budgets/budget-form';
export function BudgetsView({ api }) {
    const [showForm, setShowForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    async function handleCreateBudget(formData) {
        try {
            const response = await api.createBudget({
                categoryId: parseInt(formData.categoryId),
                amount: parseFloat(formData.amount),
                period: formData.period,
                startDate: formData.startDate,
                endDate: formData.endDate || undefined
            });
            if (response.success) {
                setShowForm(false);
                setRefreshTrigger(prev => prev + 1);
            }
        }
        catch (err) {
            console.error('Failed to create budget:', err);
            throw err;
        }
    }
    async function handleUpdateBudget(formData) {
        if (!editingBudget)
            return;
        try {
            const response = await api.updateBudget(editingBudget.id, {
                categoryId: parseInt(formData.categoryId),
                amount: parseFloat(formData.amount),
                period: formData.period,
                startDate: formData.startDate,
                endDate: formData.endDate || undefined
            });
            if (response.success) {
                setShowForm(false);
                setEditingBudget(null);
                setRefreshTrigger(prev => prev + 1);
            }
        }
        catch (err) {
            console.error('Failed to update budget:', err);
            throw err;
        }
    }
    async function handleDeleteBudget(id) {
        try {
            const response = await api.deleteBudget(id);
            if (response.success) {
                setRefreshTrigger(prev => prev + 1);
            }
        }
        catch (err) {
            console.error('Failed to delete budget:', err);
        }
    }
    function handleEditBudget(budget) {
        setEditingBudget(budget);
        setShowForm(true);
    }
    function handleCancelForm() {
        setShowForm(false);
        setEditingBudget(null);
    }
    function handleAddNew() {
        setEditingBudget(null);
        setShowForm(true);
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\uD83D\uDCB0 Budget Management" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Track and manage your spending limits by category" })] }), !showForm && (_jsx("button", { onClick: handleAddNew, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "Create Budget" }))] }) }), _jsxs("div", { className: "space-y-6", children: [showForm && (_jsx(BudgetForm, { budget: editingBudget, onSubmit: editingBudget ? handleUpdateBudget : handleCreateBudget, onCancel: handleCancelForm, api: api })), _jsx(BudgetList, { onEdit: handleEditBudget, onDelete: handleDeleteBudget, onRefresh: () => setRefreshTrigger(prev => prev + 1), api: api }, refreshTrigger)] })] }) }));
}
export default BudgetsView;
//# sourceMappingURL=budgets-view.js.map