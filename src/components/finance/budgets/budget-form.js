import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function BudgetForm({ budget, onSubmit, onCancel, api }) {
    const [formData, setFormData] = useState({
        categoryId: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0] || '',
        endDate: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [errors, setErrors] = useState({});
    useEffect(() => {
        loadCategories();
    }, []);
    useEffect(() => {
        if (budget) {
            setFormData({
                categoryId: budget.category_id.toString(),
                amount: budget.amount.toString(),
                period: budget.period,
                startDate: budget.start_date,
                endDate: budget.end_date || ''
            });
        }
    }, [budget]);
    async function loadCategories() {
        try {
            setCategoriesLoading(true);
            const response = await api.getCategories('expense');
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
    function validateForm() {
        const newErrors = {};
        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required';
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }
        if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
            newErrors.endDate = 'End date must be after start date';
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
            console.error('Failed to save budget:', err);
        }
        finally {
            setLoading(false);
        }
    }
    function handleInputChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }
    if (categoriesLoading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "text-gray-600", children: "Loading categories..." }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: budget ? 'Edit Budget' : 'Create Budget' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Category ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.categoryId, onChange: (e) => handleInputChange('categoryId', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`, disabled: loading, children: [_jsx("option", { value: "", children: "Select category..." }), categories.map((category) => (_jsxs("option", { value: category.id.toString(), children: [category.icon, " ", category.name] }, category.id)))] }), errors.categoryId && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.categoryId }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Amount ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "number", step: "0.01", value: formData.amount, onChange: (e) => handleInputChange('amount', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`, placeholder: "0.00", disabled: loading }), errors.amount && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.amount }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Period ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.period, onChange: (e) => handleInputChange('period', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, children: [_jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "yearly", children: "Yearly" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Start Date ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "date", value: formData.startDate, onChange: (e) => handleInputChange('startDate', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`, disabled: loading }), errors.startDate && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.startDate }))] }), _jsxs("div", { className: "md:col-span-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "End Date (Optional)" }), _jsx("input", { type: "date", value: formData.endDate, onChange: (e) => handleInputChange('endDate', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`, disabled: loading }), errors.endDate && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: errors.endDate })), _jsx("div", { className: "text-sm text-gray-500 mt-1", children: "Leave empty for ongoing budget" })] })] }), _jsxs("div", { className: "flex gap-3 pt-4 border-t", children: [_jsx("button", { type: "submit", disabled: loading, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: loading ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget' }), _jsx("button", { type: "button", onClick: onCancel, disabled: loading, className: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors", children: "Cancel" })] })] })] }));
}
//# sourceMappingURL=budget-form.js.map