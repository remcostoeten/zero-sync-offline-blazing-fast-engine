import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function RecurringTransactionList({ onEdit, onDelete, onToggleActive, onGenerate, api }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    useEffect(() => {
        loadRecurringTransactions();
    }, []);
    async function loadRecurringTransactions() {
        try {
            setLoading(true);
            const response = await api.getRecurringTransactions();
            if (response.success && response.data) {
                setTransactions(response.data);
                setError(null);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recurring transactions');
            console.error('Failed to load recurring transactions:', err);
        }
        finally {
            setLoading(false);
        }
    }
    async function handleGenerateTransactions() {
        try {
            setGenerating(true);
            const response = await api.generateRecurringTransactions();
            if (response.success) {
                onGenerate();
                await loadRecurringTransactions();
            }
        }
        catch (err) {
            console.error('Failed to generate transactions:', err);
        }
        finally {
            setGenerating(false);
        }
    }
    async function handleToggleActive(transaction) {
        try {
            const newActiveStatus = !transaction.is_active;
            await api.updateRecurringTransaction(transaction.id, {
                is_active: newActiveStatus
            });
            onToggleActive(transaction.id, newActiveStatus);
            await loadRecurringTransactions();
        }
        catch (err) {
            console.error('Failed to toggle transaction status:', err);
        }
    }
    function handleDelete(id) {
        if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
            onDelete(id);
            loadRecurringTransactions();
        }
    }
    function formatRecurrence(rule) {
        switch (rule) {
            case 'weekly': return 'Weekly';
            case 'monthly': return 'Monthly';
            case 'yearly': return 'Yearly';
            default: return rule;
        }
    }
    function getNextDueStatus(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0)
            return { text: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-100' };
        if (diffDays === 0)
            return { text: 'Due Today', color: 'text-orange-600', bgColor: 'bg-orange-100' };
        if (diffDays <= 7)
            return { text: `Due in ${diffDays} days`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        return { text: `Due in ${diffDays} days`, color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    if (loading) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "text-lg text-gray-600", children: "Loading recurring transactions..." }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-red-600 mb-4", children: error }), _jsx("button", { onClick: () => {
                        setError(null);
                        loadRecurringTransactions();
                    }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Retry" })] }));
    }
    if (transactions.length === 0) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-500 text-lg", children: "No recurring transactions found" }), _jsx("div", { className: "text-gray-400 text-sm mt-2", children: "Set up recurring income or expenses to automate your financial tracking" })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Scheduled Transactions" }), _jsx("button", { onClick: handleGenerateTransactions, disabled: generating, className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50", children: generating ? 'Generating...' : 'Generate Due Transactions' })] }), _jsx("div", { className: "grid grid-cols-1 gap-4", children: transactions.map((transaction) => {
                    const dueStatus = getNextDueStatus(transaction.next_due_date);
                    return (_jsxs("div", { className: `bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow ${transaction.is_active ? '' : 'opacity-60'}`, style: { borderLeftColor: transaction.category_color }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: transaction.category_icon }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-lg", children: transaction.name }), _jsxs("div", { className: "text-sm text-gray-600", children: [transaction.category_name, " \u2022 ", formatRecurrence(transaction.recurrence_rule)] })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: `text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`, children: [transaction.type === 'income' ? '+' : '-', "$", transaction.amount.toFixed(2)] }), _jsx("div", { className: `px-3 py-1 rounded-full text-sm font-medium ${dueStatus.bgColor} ${dueStatus.color}`, children: dueStatus.text })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-gray-500", children: "Status" }), _jsx("div", { className: `font-medium ${transaction.is_active ? 'text-green-600' : 'text-gray-500'}`, children: transaction.is_active ? 'Active' : 'Inactive' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-500", children: "Next Due" }), _jsx("div", { className: "font-medium", children: new Date(transaction.next_due_date).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-500", children: "Last Generated" }), _jsx("div", { className: "font-medium", children: transaction.last_generated ?
                                                    new Date(transaction.last_generated).toLocaleDateString() :
                                                    'Never' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-500", children: "Recurrence" }), _jsx("div", { className: "font-medium", children: formatRecurrence(transaction.recurrence_rule) })] })] }), transaction.note && (_jsxs("div", { className: "mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded", children: [_jsx("strong", { children: "Note:" }), " ", transaction.note] })), _jsxs("div", { className: "flex gap-2 pt-2 border-t", children: [_jsx("button", { onClick: () => handleToggleActive(transaction), className: `px-3 py-2 text-sm rounded-md transition-colors ${transaction.is_active
                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'}`, children: transaction.is_active ? 'Deactivate' : 'Activate' }), _jsx("button", { onClick: () => onEdit(transaction), className: "px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(transaction.id), className: "px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors", children: "Delete" })] })] }, transaction.id));
                }) })] }));
}
//# sourceMappingURL=recurring-list.js.map