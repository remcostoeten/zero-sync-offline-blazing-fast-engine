import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function BudgetList({ onEdit, onDelete, onRefresh, api }) {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadBudgets();
    }, []);
    async function loadBudgets() {
        try {
            setLoading(true);
            const response = await api.getBudgets();
            if (response.success && response.data) {
                setBudgets(response.data);
                setError(null);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load budgets');
            console.error('Failed to load budgets:', err);
        }
        finally {
            setLoading(false);
        }
    }
    function handleDelete(id) {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            onDelete(id);
            loadBudgets();
        }
    }
    function getStatusColor(status) {
        switch (status) {
            case 'on_track': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'exceeded': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }
    function getStatusBadgeColor(status) {
        switch (status) {
            case 'on_track': return 'bg-green-100 text-green-800';
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            case 'exceeded': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    function getProgressBarColor(status) {
        switch (status) {
            case 'on_track': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'exceeded': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }
    if (loading) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "text-lg text-gray-600", children: "Loading budgets..." }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-red-600 mb-4", children: error }), _jsx("button", { onClick: () => {
                        setError(null);
                        loadBudgets();
                    }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Retry" })] }));
    }
    if (budgets.length === 0) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-500 text-lg", children: "No budgets found" }), _jsx("div", { className: "text-gray-400 text-sm mt-2", children: "Create your first budget to start tracking your spending" })] }));
    }
    return (_jsx("div", { className: "space-y-6", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: budgets.map((budget) => (_jsx("div", { className: "bg-white rounded-lg shadow-md border-l-4 hover:shadow-lg transition-shadow duration-200", style: { borderLeftColor: budget.category_color }, children: _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: budget.category_icon }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: budget.category_name }), _jsx("span", { className: `inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(budget.status)}`, children: budget.status.replace('_', ' ').toUpperCase() })] })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-gray-500", children: "Budget" }), _jsxs("div", { className: "font-semibold", children: ["$", budget.amount.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-500", children: "Period" }), _jsx("div", { className: "font-medium capitalize", children: budget.period })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { children: ["Spent: $", budget.spent_amount.toFixed(2)] }), _jsxs("span", { className: getStatusColor(budget.status), children: [budget.percentage_used.toFixed(1), "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: `h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budget.status)}`, style: { width: `${Math.min(budget.percentage_used, 100)}%` } }) }), _jsxs("div", { className: "flex justify-between text-sm text-gray-600", children: [_jsxs("span", { children: ["Remaining: $", budget.remaining_amount.toFixed(2)] }), _jsx("span", { children: budget.end_date ?
                                                        `Until ${new Date(budget.end_date).toLocaleDateString()}` :
                                                        'Ongoing' })] })] }), _jsxs("div", { className: "flex gap-2 pt-2 border-t", children: [_jsx("button", { onClick: () => onEdit(budget), className: "flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(budget.id), className: "px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors", children: "Delete" })] })] })] }) }, budget.id))) }) }));
}
//# sourceMappingURL=budget-list.js.map