import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function RecurringTransactionForm({ transaction, onSubmit, onCancel, api }) {
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        type: 'expense',
        categoryId: '',
        recurrenceRule: 'monthly',
        nextDueDate: new Date().toISOString().split('T')[0] || '',
        note: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [errors, setErrors] = useState({});
    useEffect(() => {
        loadCategories();
    }, [formData.type]);
    useEffect(() => {
        if (transaction) {
            setFormData({
                name: transaction.name,
                amount: transaction.amount.toString(),
                type: transaction.type,
                categoryId: transaction.category_id.toString(),
                recurrenceRule: transaction.recurrence_rule,
                nextDueDate: transaction.next_due_date,
                note: transaction.note || ''
            });
        }
    }, [transaction]);
    async function loadCategories() {
        try {
            setCategoriesLoading(true);
            const response = await api.getCategories(formData.type);
            if (response.success && response.data) {
                setCategories(response.data);
            }
        }
        catch (err) {
            console.error('Failed to load categories:', err);
        }
        finally {
            setCategoriesLoading(false);
        }
    }
    function calculateNextDueDate(startDate, rule) {
        const date = new Date(startDate);
        switch (rule) {
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date.toISOString().split('T')[0] || '';
    }
    function validateForm() {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required';
        }
        if (!formData.nextDueDate) {
            newErrors.nextDueDate = 'Next due date is required';
        }
        else {
            const dueDate = new Date(formData.nextDueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dueDate < today) {
                newErrors.nextDueDate = 'Next due date cannot be in the past';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        try {
            setLoading(true);
            await onSubmit(formData);
        }
        catch (err) {
            console.error('Failed to save recurring transaction:', err);
        }
        finally {
            setLoading(false);
        }
    }
    function handleInputChange(field, value) {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            // Auto-calculate next due date when recurrence rule changes
            if (field === 'recurrenceRule' && updated.nextDueDate) {
                const today = new Date().toISOString().split('T')[0] || '';
                updated.nextDueDate = calculateNextDueDate(today, value);
            }
            return updated;
        });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }
    if (categoriesLoading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "text-gray-600", children: "Loading categories..." }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: transaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Transaction Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Monthly rent, weekly groceries, etc.", disabled: loading }), errors.name && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.name }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Amount ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "number", step: "0.01", value: formData.amount, onChange: (e) => handleInputChange('amount', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`, placeholder: "0.00", disabled: loading }), errors.amount && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.amount }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.type, onChange: (e) => handleInputChange('type', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, children: [_jsx("option", { value: "expense", children: "Expense" }), _jsx("option", { value: "income", children: "Income" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Category ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.categoryId, onChange: (e) => handleInputChange('categoryId', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`, disabled: loading || categoriesLoading, children: [_jsx("option", { value: "", children: "Select category..." }), categories.map((category) => (_jsxs("option", { value: category.id.toString(), children: [category.icon, " ", category.name] }, category.id)))] }), errors.categoryId && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.categoryId }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Frequency ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.recurrenceRule, onChange: (e) => handleInputChange('recurrenceRule', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, children: [_jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "yearly", children: "Yearly" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Next Due Date ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "date", value: formData.nextDueDate, onChange: (e) => handleInputChange('nextDueDate', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nextDueDate ? 'border-red-500' : 'border-gray-300'}`, disabled: loading, min: new Date().toISOString().split('T')[0] }), errors.nextDueDate && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.nextDueDate }))] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Note (Optional)" }), _jsx("textarea", { value: formData.note, onChange: (e) => handleInputChange('note', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3, placeholder: "Add any additional details...", disabled: loading })] })] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-blue-900 mb-2", children: "\uD83D\uDD04 How Recurring Transactions Work" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsx("li", { children: "\u2022 Transactions will be automatically created when they become due" }), _jsx("li", { children: "\u2022 You can manually generate due transactions using the \"Generate\" button" }), _jsx("li", { children: "\u2022 Inactive transactions won't generate new entries but remain saved" }), _jsx("li", { children: "\u2022 The next due date automatically updates after each generation" })] })] }), _jsxs("div", { className: "flex gap-3 pt-4 border-t", children: [_jsx("button", { type: "submit", disabled: loading, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: loading ? 'Saving...' : transaction ? 'Update Transaction' : 'Create Transaction' }), _jsx("button", { type: "button", onClick: onCancel, disabled: loading, className: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors", children: "Cancel" })] })] })] }));
}
//# sourceMappingURL=recurring-form.js.map