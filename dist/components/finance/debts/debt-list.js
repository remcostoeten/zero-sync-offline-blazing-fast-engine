'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { financeApi } from '../../../lib/api/finance-api';
const DebtList = ({ onEdit, onDelete, onAddPayment, showActions = true }) => {
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('balance');
    const [sortOrder, setSortOrder] = useState('desc');
    useEffect(() => {
        loadDebts();
    }, []);
    const loadDebts = async () => {
        try {
            setLoading(true);
            const response = await financeApi.getDebts();
            setDebts(response.data || []);
        }
        catch (err) {
            console.error('Error loading debts:', err);
            setError('Failed to load debts');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };
    const sortedDebts = [...debts].sort((a, b) => {
        let aValue, bValue;
        switch (sortBy) {
            case 'balance':
                aValue = a.current_balance;
                bValue = b.current_balance;
                break;
            case 'rate':
                aValue = a.interest_rate;
                bValue = b.interest_rate;
                break;
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'due_date':
                aValue = a.end_date ? new Date(a.end_date).getTime() : 0;
                bValue = b.end_date ? new Date(b.end_date).getTime() : 0;
                break;
            default:
                return 0;
        }
        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
        else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });
    const getDebtTypeIcon = (type) => {
        switch (type) {
            case 'mortgage': return '🏠';
            case 'credit_card': return '💳';
            case 'loan': return '💰';
            case 'personal_debt': return '👤';
            case 'other': return '📄';
            default: return '💰';
        }
    };
    const getDebtTypeColor = (type) => {
        switch (type) {
            case 'mortgage': return 'bg-green-100 text-green-800';
            case 'credit_card': return 'bg-red-100 text-red-800';
            case 'loan': return 'bg-blue-100 text-blue-800';
            case 'personal_debt': return 'bg-purple-100 text-purple-800';
            case 'other': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getPaymentFrequencyText = (frequency) => {
        switch (frequency) {
            case 'weekly': return 'Weekly';
            case 'biweekly': return 'Bi-weekly';
            case 'monthly': return 'Monthly';
            case 'quarterly': return 'Quarterly';
            case 'yearly': return 'Yearly';
            default: return frequency;
        }
    };
    const calculatePayoffProgress = (debt) => {
        if (debt.original_amount === 0)
            return 0;
        const paidAmount = debt.original_amount - debt.current_balance;
        return Math.max(0, Math.min(100, (paidAmount / debt.original_amount) * 100));
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };
    const calculateMonthsRemaining = (debt) => {
        if (!debt.end_date)
            return null;
        const now = new Date();
        const endDate = new Date(debt.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
        return Math.max(0, diffMonths);
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-4", children: [...Array(3)].map((_, i) => (_jsx("div", { className: "animate-pulse", children: _jsx("div", { className: "h-32 bg-gray-200 rounded-lg" }) }, i))) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-red-600 mb-4", children: error }), _jsx("button", { onClick: loadDebts, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Try Again" })] }));
    }
    if (debts.length === 0) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCB3" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No debts found" }), _jsx("p", { className: "text-gray-600", children: "Great job! You don't have any debts to track." })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-4 mb-4", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Sort by:" }), _jsx("div", { className: "flex space-x-2", children: [
                            { key: 'balance', label: 'Balance' },
                            { key: 'rate', label: 'Interest Rate' },
                            { key: 'name', label: 'Name' },
                            { key: 'due_date', label: 'Due Date' }
                        ].map((option) => (_jsxs("button", { onClick: () => handleSort(option.key), className: `px-3 py-1 text-sm rounded-md ${sortBy === option.key
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [option.label, sortBy === option.key && (_jsx("span", { className: "ml-1", children: sortOrder === 'asc' ? '↑' : '↓' }))] }, option.key))) })] }), _jsx("div", { className: "grid gap-4", children: sortedDebts.map((debt) => {
                    const progress = calculatePayoffProgress(debt);
                    const monthsRemaining = calculateMonthsRemaining(debt);
                    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: getDebtTypeIcon(debt.type) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: debt.name }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDebtTypeColor(debt.type)}`, children: debt.type.replace('_', ' ') })] })] }), showActions && (_jsxs("div", { className: "flex items-center space-x-2", children: [onAddPayment && (_jsx("button", { onClick: () => onAddPayment(debt), className: "px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm", children: "Add Payment" })), onEdit && (_jsx("button", { onClick: () => onEdit(debt), className: "px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm", children: "Edit" })), onDelete && (_jsx("button", { onClick: () => onDelete(debt), className: "px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm", children: "Delete" }))] }))] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm text-gray-600 mb-1", children: [_jsx("span", { children: "Payoff Progress" }), _jsxs("span", { children: [progress.toFixed(1), "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full transition-all duration-300", style: { width: `${progress}%` } }) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Current Balance" }), _jsx("div", { className: "font-semibold text-lg text-red-600", children: formatCurrency(debt.current_balance) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Original Amount" }), _jsx("div", { className: "font-medium", children: formatCurrency(debt.original_amount) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Interest Rate" }), _jsxs("div", { className: "font-medium", children: [debt.interest_rate, "% APR"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Minimum Payment" }), _jsx("div", { className: "font-medium", children: formatCurrency(debt.minimum_payment) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Payment Frequency" }), _jsx("div", { className: "font-medium", children: getPaymentFrequencyText(debt.payment_frequency) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Start Date" }), _jsx("div", { className: "font-medium", children: formatDate(debt.start_date) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "End Date" }), _jsx("div", { className: "font-medium", children: formatDate(debt.end_date) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Time Remaining" }), _jsx("div", { className: "font-medium", children: monthsRemaining !== null ? `${monthsRemaining} months` : 'N/A' })] })] }), debt.notes && (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Notes" }), _jsx("div", { className: "text-sm", children: debt.notes })] })), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "text-gray-600", children: ["Paid: ", formatCurrency(debt.original_amount - debt.current_balance)] }), _jsxs("div", { className: "text-gray-600", children: ["Remaining: ", formatCurrency(debt.current_balance)] })] }) })] }, debt.id));
                }) })] }));
};
export default DebtList;
//# sourceMappingURL=debt-list.js.map