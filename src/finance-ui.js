import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// ============================================================================
// API SERVICE
// ============================================================================
class FinanceAPI {
    baseURL;
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
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
    // Categories
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
    // Transactions
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
    // Summary
    async getSummary(filters) {
        const params = new URLSearchParams();
        if (filters?.startDate)
            params.append('startDate', filters.startDate);
        if (filters?.endDate)
            params.append('endDate', filters.endDate);
        const queryString = params.toString();
        return this.request(`/summary${queryString ? `?${queryString}` : ''}`);
    }
}
const api = new FinanceAPI();
// ============================================================================
// UTILITY COMPONENTS
// ============================================================================
const Card = ({ children, className = '' }) => (_jsx("div", { className: `bg-white rounded-lg shadow-md p-6 ${className}`, children: children }));
const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '', type = 'button' }) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700'
    };
    return (_jsx("button", { type: type, className: `${baseClasses} ${variantClasses[variant]} ${className}`, onClick: onClick, disabled: disabled, children: children }));
};
const Input = ({ label, value, onChange, type = 'text', placeholder, required = false, className = '', step }) => (_jsxs("div", { className: `mb-4 ${className}`, children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [label, " ", required && _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, required: required, step: step, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }));
const Select = ({ label, value, onChange, options, required = false, className = '' }) => (_jsxs("div", { className: `mb-4 ${className}`, children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [label, " ", required && _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: value, onChange: (e) => onChange(e.target.value), required: required, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Select..." }), options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }));
// ============================================================================
// MAIN COMPONENTS
// ============================================================================
const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadSummary();
    }, []);
    const loadSummary = async () => {
        try {
            setLoading(true);
            const response = await api.getSummary();
            setSummary(response.data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load summary');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-lg text-gray-600", children: "Loading dashboard..." }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-red-600 mb-4", children: error }), _jsx(Button, { onClick: loadSummary, children: "Retry" })] }));
    }
    if (!summary)
        return null;
    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(Card, { children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["$", summary.overall.totalIncome.toFixed(2)] }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Income" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-red-600", children: ["$", summary.overall.totalExpense.toFixed(2)] }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Expenses" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: `text-2xl font-bold ${summary.overall.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`, children: ["$", summary.overall.netIncome.toFixed(2)] }), _jsx("div", { className: "text-sm text-gray-600", children: "Net Income" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: summary.overall.totalTransactions }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Transactions" })] }) })] }));
};
const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'expense',
        color: '#3B82F6',
        icon: '💰'
    });
    useEffect(() => {
        loadCategories();
    }, []);
    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await api.getCategories();
            setCategories(response.data);
        }
        catch (err) {
            console.error('Failed to load categories:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, formData);
            }
            else {
                await api.createCategory(formData);
            }
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', type: 'expense', color: '#3B82F6', icon: '💰' });
            loadCategories();
        }
        catch (err) {
            console.error('Failed to save category:', err);
        }
    };
    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon
        });
        setShowForm(true);
    };
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.deleteCategory(id);
                loadCategories();
            }
            catch (err) {
                console.error('Failed to delete category:', err);
            }
        }
    };
    if (loading) {
        return _jsx("div", { className: "text-center py-8", children: "Loading categories..." });
    }
    return (_jsxs(Card, { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Categories" }), _jsx(Button, { onClick: () => setShowForm(true), children: "Add Category" })] }), showForm && (_jsxs("form", { onSubmit: handleSubmit, className: "mb-6 p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Name", value: formData.name, onChange: (value) => setFormData({ ...formData, name: value }), required: true }), _jsx(Select, { label: "Type", value: formData.type, onChange: (value) => setFormData({ ...formData, type: value }), options: [
                                    { value: 'income', label: 'Income' },
                                    { value: 'expense', label: 'Expense' }
                                ], required: true }), _jsx(Input, { label: "Color", value: formData.color, onChange: (value) => setFormData({ ...formData, color: value }), type: "color" }), _jsx(Input, { label: "Icon", value: formData.icon, onChange: (value) => setFormData({ ...formData, icon: value }), placeholder: "\uD83D\uDCB0" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { type: "submit", children: [editingCategory ? 'Update' : 'Create', " Category"] }), _jsx(Button, { variant: "secondary", onClick: () => {
                                    setShowForm(false);
                                    setEditingCategory(null);
                                    setFormData({ name: '', type: 'expense', color: '#3B82F6', icon: '💰' });
                                }, children: "Cancel" })] })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: categories.map((category) => (_jsx("div", { className: "p-4 border rounded-lg hover:shadow-md transition-shadow", style: { borderLeftColor: category.color, borderLeftWidth: '4px' }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: category.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: category.name }), _jsx("div", { className: "text-sm text-gray-600 capitalize", children: category.type })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "secondary", onClick: () => handleEdit(category), className: "px-2 py-1 text-sm", children: "Edit" }), _jsx(Button, { variant: "danger", onClick: () => handleDelete(category.id), className: "px-2 py-1 text-sm", children: "Delete" })] })] }) }, category.id))) })] }));
};
const TransactionManager = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        categoryId: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsRes, categoriesRes] = await Promise.all([
                api.getTransactions(),
                api.getCategories()
            ]);
            setTransactions(transactionsRes.data);
            setCategories(categoriesRes.data);
        }
        catch (err) {
            console.error('Failed to load data:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTransaction) {
                await api.updateTransaction(editingTransaction.id, {
                    amount: parseFloat(formData.amount),
                    type: formData.type,
                    category_id: parseInt(formData.categoryId),
                    note: formData.note,
                    date: formData.date
                });
            }
            else {
                await api.createTransaction({
                    amount: parseFloat(formData.amount),
                    type: formData.type,
                    categoryId: parseInt(formData.categoryId),
                    note: formData.note,
                    date: formData.date
                });
            }
            setShowForm(false);
            setEditingTransaction(null);
            setFormData({ amount: '', type: 'expense', categoryId: '', note: '', date: new Date().toISOString().split('T')[0] });
            loadData();
        }
        catch (err) {
            console.error('Failed to save transaction:', err);
        }
    };
    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            amount: transaction.amount.toString(),
            type: transaction.type,
            categoryId: transaction.category_id.toString(),
            note: transaction.note,
            date: transaction.date
        });
        setShowForm(true);
    };
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await api.deleteTransaction(id);
                loadData();
            }
            catch (err) {
                console.error('Failed to delete transaction:', err);
            }
        }
    };
    if (loading) {
        return _jsx("div", { className: "text-center py-8", children: "Loading transactions..." });
    }
    return (_jsxs(Card, { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Transactions" }), _jsx(Button, { onClick: () => setShowForm(true), children: "Add Transaction" })] }), showForm && (_jsxs("form", { onSubmit: handleSubmit, className: "mb-6 p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Amount", value: formData.amount, onChange: (value) => setFormData({ ...formData, amount: value }), type: "number", step: "0.01", required: true }), _jsx(Select, { label: "Type", value: formData.type, onChange: (value) => setFormData({ ...formData, type: value }), options: [
                                    { value: 'income', label: 'Income' },
                                    { value: 'expense', label: 'Expense' }
                                ], required: true }), _jsx(Select, { label: "Category", value: formData.categoryId, onChange: (value) => setFormData({ ...formData, categoryId: value }), options: categories
                                    .filter(c => c.type === formData.type)
                                    .map(c => ({ value: c.id.toString(), label: c.name })), required: true }), _jsx(Input, { label: "Date", value: formData.date, onChange: (value) => setFormData({ ...formData, date: value }), type: "date", required: true }), _jsx(Input, { label: "Note", value: formData.note, onChange: (value) => setFormData({ ...formData, note: value }), placeholder: "Optional note", className: "md:col-span-2" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { type: "submit", children: [editingTransaction ? 'Update' : 'Create', " Transaction"] }), _jsx(Button, { variant: "secondary", onClick: () => {
                                    setShowForm(false);
                                    setEditingTransaction(null);
                                    setFormData({ amount: '', type: 'expense', categoryId: '', note: '', date: new Date().toISOString().split('T')[0] });
                                }, children: "Cancel" })] })] })), _jsx("div", { className: "space-y-3", children: transactions.map((transaction) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: transaction.category_icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: transaction.category_name }), _jsx("div", { className: "text-sm text-gray-600", children: transaction.note || 'No note' }), _jsx("div", { className: "text-xs text-gray-500", children: transaction.date })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: `text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`, children: [transaction.type === 'income' ? '+' : '-', "$", transaction.amount.toFixed(2)] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "secondary", onClick: () => handleEdit(transaction), className: "px-2 py-1 text-sm", children: "Edit" }), _jsx(Button, { variant: "danger", onClick: () => handleDelete(transaction.id), className: "px-2 py-1 text-sm", children: "Delete" })] })] })] }, transaction.id))) })] }));
};
const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'categories', label: 'Categories', icon: '📂' },
        { id: 'transactions', label: 'Transactions', icon: '💸' }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow-sm border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center", children: _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\uD83D\uDCB0 Finance Manager" }) }), _jsx("div", { className: "text-sm text-gray-500", children: "Powered by Turso Offline Sync" })] }) }) }), _jsx("nav", { className: "bg-white border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex space-x-8", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx("span", { className: "mr-2", children: tab.icon }), tab.label] }, tab.id))) }) }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [activeTab === 'dashboard' && _jsx(Dashboard, {}), activeTab === 'categories' && _jsx(CategoryManager, {}), activeTab === 'transactions' && _jsx(TransactionManager, {})] })] }));
};
// ============================================================================
// RENDER APP
// ============================================================================
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(_jsx(App, {}));
}
export default App;
//# sourceMappingURL=finance-ui.js.map