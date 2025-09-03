import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  note: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface FinancialSummary {
  overall: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    totalTransactions: number;
  };
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    transactions: number;
  }>;
  categories: Array<{
    id: number;
    name: string;
    type: string;
    color: string;
    icon: string;
    total_amount: number;
    transaction_count: number;
  }>;
  recentTransactions: Transaction[];
}

// ============================================================================
// API SERVICE
// ============================================================================

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

  // Categories
  async getCategories(type?: 'income' | 'expense'): Promise<{ success: boolean; data: Category[] }> {
    const params = type ? `?type=${type}` : '';
    return this.request(`/categories${params}`);
  }

  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<{ success: boolean; message: string }> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    type?: 'income' | 'expense';
    limit?: number;
  }): Promise<{ success: boolean; data: Transaction[] }> {
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
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<{ success: boolean; message: string }> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Summary
  async getSummary(filters?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: FinancialSummary }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return this.request(`/summary${queryString ? `?${queryString}` : ''}`);
  }
}

const api = new FinanceAPI();

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, required = false, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}> = ({ label, value, onChange, options, required = false, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await api.getSummary();
      setSummary(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadSummary}>Retry</Button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">${summary.overall.totalIncome.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Income</div>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">${summary.overall.totalExpense.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Expenses</div>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className={`text-2xl font-bold ${summary.overall.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.overall.netIncome.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Net Income</div>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.overall.totalTransactions}</div>
          <div className="text-sm text-gray-600">Total Transactions</div>
        </div>
      </Card>
    </div>
  );
};

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
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
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
      } else {
        await api.createCategory(formData);
      }
      
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', type: 'expense', color: '#3B82F6', icon: '💰' });
      loadCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.deleteCategory(id);
        loadCategories();
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Button onClick={() => setShowForm(true)}>Add Category</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            <Select
              label="Type"
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
              options={[
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' }
              ]}
              required
            />
            <Input
              label="Color"
              value={formData.color}
              onChange={(value) => setFormData({ ...formData, color: value })}
              type="color"
            />
            <Input
              label="Icon"
              value={formData.icon}
              onChange={(value) => setFormData({ ...formData, icon: value })}
              placeholder="💰"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
                setFormData({ name: '', type: 'expense', color: '#3B82F6', icon: '💰' });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{category.type}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(category)}
                  className="px-2 py-1 text-sm"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(category.id)}
                  className="px-2 py-1 text-sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const TransactionManager: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
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
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction.id, {
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId)
        });
      } else {
        await api.createTransaction({
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId)
        });
      }
      
      setShowForm(false);
      setEditingTransaction(null);
      setFormData({ amount: '', type: 'expense', categoryId: '', note: '', date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const handleEdit = (transaction: Transaction) => {
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.deleteTransaction(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <Button onClick={() => setShowForm(true)}>Add Transaction</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              type="number"
              step="0.01"
              required
            />
            <Select
              label="Type"
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
              options={[
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' }
              ]}
              required
            />
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value })}
              options={categories
                .filter(c => c.type === formData.type)
                .map(c => ({ value: c.id.toString(), label: c.name }))}
              required
            />
            <Input
              label="Date"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              type="date"
              required
            />
            <Input
              label="Note"
              value={formData.note}
              onChange={(value) => setFormData({ ...formData, note: value })}
              placeholder="Optional note"
              className="md:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editingTransaction ? 'Update' : 'Create'} Transaction
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingTransaction(null);
                setFormData({ amount: '', type: 'expense', categoryId: '', note: '', date: new Date().toISOString().split('T')[0] });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{transaction.category_icon}</span>
              <div>
                <div className="font-medium">{transaction.category_name}</div>
                <div className="text-sm text-gray-600">{transaction.note || 'No note'}</div>
                <div className="text-xs text-gray-500">{transaction.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(transaction)}
                  className="px-2 py-1 text-sm"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(transaction.id)}
                  className="px-2 py-1 text-sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'transactions'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'transactions', label: 'Transactions', icon: '💸' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">💰 Finance Manager</h1>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Turso Offline Sync
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'transactions' && <TransactionManager />}
      </main>
    </div>
  );
};

// ============================================================================
// RENDER APP
// ============================================================================

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

export default App;
