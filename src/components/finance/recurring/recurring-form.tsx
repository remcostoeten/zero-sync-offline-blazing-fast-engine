import React, { useState, useEffect } from 'react';
import type { TRecurringTransaction, TCategory, TRecurringTransactionFormData, TApiListResponse } from '../../../types/finance';

type TProps = {
  transaction?: TRecurringTransaction | null;
  onSubmit: (formData: TRecurringTransactionFormData) => Promise<void>;
  onCancel: () => void;
  api: any;
};

export function RecurringTransactionForm({ transaction, onSubmit, onCancel, api }: TProps) {
  const [formData, setFormData] = useState<TRecurringTransactionFormData>({
    name: '',
    amount: '',
    type: 'expense',
    categoryId: '',
    recurrenceRule: 'monthly',
    nextDueDate: new Date().toISOString().split('T')[0] || '',
    note: ''
  });
  
  const [categories, setCategories] = useState<TCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const response: TApiListResponse<TCategory> = await api.getCategories(formData.type);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }

  function calculateNextDueDate(startDate: string, rule: string): string {
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
    const newErrors: Record<string, string> = {};

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
    } else {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err) {
      console.error('Failed to save recurring transaction:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(field: keyof TRecurringTransactionFormData, value: string) {
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
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">
        {transaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Monthly rent, weekly groceries, etc."
              disabled={loading}
            />
            {errors.name && (
              <div className="text-red-500 text-sm mt-1">{errors.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.amount && (
              <div className="text-red-500 text-sm mt-1">{errors.amount}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as 'income' | 'expense')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || categoriesLoading}
            >
              <option value="">Select category...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <div className="text-red-500 text-sm mt-1">{errors.categoryId}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.recurrenceRule}
              onChange={(e) => handleInputChange('recurrenceRule', e.target.value as 'weekly' | 'monthly' | 'yearly')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => handleInputChange('nextDueDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nextDueDate ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.nextDueDate && (
              <div className="text-red-500 text-sm mt-1">{errors.nextDueDate}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any additional details..."
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🔄 How Recurring Transactions Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Transactions will be automatically created when they become due</li>
            <li>• You can manually generate due transactions using the "Generate" button</li>
            <li>• Inactive transactions won't generate new entries but remain saved</li>
            <li>• The next due date automatically updates after each generation</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : transaction ? 'Update Transaction' : 'Create Transaction'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
