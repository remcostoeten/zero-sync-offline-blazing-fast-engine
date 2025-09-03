import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { RecurringTransactionList } from '../components/finance/recurring/recurring-list';
import { RecurringTransactionForm } from '../components/finance/recurring/recurring-form';
export function RecurringTransactionsView({ api }) {
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    async function handleCreateTransaction(formData) {
        try {
            const response = await api.createRecurringTransaction({
                name: formData.name,
                amount: parseFloat(formData.amount),
                type: formData.type,
                categoryId: parseInt(formData.categoryId),
                recurrenceRule: formData.recurrenceRule,
                nextDueDate: formData.nextDueDate,
                note: formData.note || undefined
            });
            if (response.success) {
                setShowForm(false);
                setRefreshTrigger(prev => prev + 1);
            }
        }
        catch (err) {
            console.error('Failed to create recurring transaction:', err);
            throw err;
        }
    }
    async function handleUpdateTransaction(formData) {
        if (!editingTransaction)
            return;
        try {
            const response = await api.updateRecurringTransaction(editingTransaction.id, {
                name: formData.name,
                amount: parseFloat(formData.amount),
                type: formData.type,
                categoryId: parseInt(formData.categoryId),
                recurrenceRule: formData.recurrenceRule,
                nextDueDate: formData.nextDueDate,
                note: formData.note || undefined
            });
            if (response.success) {
                setShowForm(false);
                setEditingTransaction(null);
                setRefreshTrigger(prev => prev + 1);
            }
        }
        catch (err) {
            console.error('Failed to update recurring transaction:', err);
            throw err;
        }
    }
    async function handleDeleteTransaction(id) {
        try {
            const response = await api.deleteRecurringTransaction(id);
            if (response.success) {
                setRefreshTrigger(prev => prev + 1);
            }
        }
        catch (err) {
            console.error('Failed to delete recurring transaction:', err);
        }
    }
    function handleEditTransaction(transaction) {
        setEditingTransaction(transaction);
        setShowForm(true);
    }
    function handleCancelForm() {
        setShowForm(false);
        setEditingTransaction(null);
    }
    function handleAddNew() {
        setEditingTransaction(null);
        setShowForm(true);
    }
    function handleToggleActive(id, isActive) {
        setRefreshTrigger(prev => prev + 1);
    }
    function handleGenerate() {
        setRefreshTrigger(prev => prev + 1);
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\uD83D\uDD04 Recurring Transactions" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Automate your regular income and expenses" })] }), !showForm && (_jsx("button", { onClick: handleAddNew, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "Add Recurring Transaction" }))] }) }), _jsxs("div", { className: "space-y-6", children: [showForm && (_jsx(RecurringTransactionForm, { transaction: editingTransaction, onSubmit: editingTransaction ? handleUpdateTransaction : handleCreateTransaction, onCancel: handleCancelForm, api: api })), _jsx(RecurringTransactionList, { onEdit: handleEditTransaction, onDelete: handleDeleteTransaction, onToggleActive: handleToggleActive, onGenerate: handleGenerate, api: api }, refreshTrigger)] })] }) }));
}
export default RecurringTransactionsView;
//# sourceMappingURL=recurring-transactions-view.js.map