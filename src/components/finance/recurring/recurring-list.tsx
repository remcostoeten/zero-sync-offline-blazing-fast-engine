import React, { useState, useEffect } from 'react';
import type { TRecurringTransaction, TApiListResponse } from '../../../types/finance';

type TProps = {
  onEdit: (transaction: TRecurringTransaction) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onGenerate: () => void;
  api: any;
};

export function RecurringTransactionList({ onEdit, onDelete, onToggleActive, onGenerate, api }: TProps) {
  const [transactions, setTransactions] = useState<TRecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  async function loadRecurringTransactions() {
    try {
      setLoading(true);
      const response: TApiListResponse<TRecurringTransaction> = await api.getRecurringTransactions();
      if (response.success && response.data) {
        setTransactions(response.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring transactions');
      console.error('Failed to load recurring transactions:', err);
    } finally {
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
    } catch (err) {
      console.error('Failed to generate transactions:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleActive(transaction: TRecurringTransaction) {
    try {
      const newActiveStatus = !transaction.is_active;
      await api.updateRecurringTransaction(transaction.id, {
        is_active: newActiveStatus
      });
      onToggleActive(transaction.id, newActiveStatus);
      await loadRecurringTransactions();
    } catch (err) {
      console.error('Failed to toggle transaction status:', err);
    }
  }

  function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      onDelete(id);
      loadRecurringTransactions();
    }
  }

  function formatRecurrence(rule: string) {
    switch (rule) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly'; 
      case 'yearly': return 'Yearly';
      default: return rule;
    }
  }

  function getNextDueStatus(dueDate: string) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { text: `Due in ${diffDays} days`, color: 'text-green-600', bgColor: 'bg-green-100' };
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Loading recurring transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => {
            setError(null);
            loadRecurringTransactions();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No recurring transactions found</div>
        <div className="text-gray-400 text-sm mt-2">
          Set up recurring income or expenses to automate your financial tracking
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scheduled Transactions</h3>
        <button
          onClick={handleGenerateTransactions}
          disabled={generating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Due Transactions'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {transactions.map((transaction) => {
          const dueStatus = getNextDueStatus(transaction.next_due_date);
          
          return (
            <div
              key={transaction.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow ${
                transaction.is_active ? '' : 'opacity-60'
              }`}
              style={{ borderLeftColor: transaction.category_color }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{transaction.category_icon}</span>
                  <div>
                    <h4 className="font-semibold text-lg">{transaction.name}</h4>
                    <div className="text-sm text-gray-600">
                      {transaction.category_name} • {formatRecurrence(transaction.recurrence_rule)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${dueStatus.bgColor} ${dueStatus.color}`}>
                    {dueStatus.text}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className={`font-medium ${transaction.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                    {transaction.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">Next Due</div>
                  <div className="font-medium">
                    {new Date(transaction.next_due_date).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">Last Generated</div>
                  <div className="font-medium">
                    {transaction.last_generated ? 
                      new Date(transaction.last_generated).toLocaleDateString() :
                      'Never'
                    }
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">Recurrence</div>
                  <div className="font-medium">{formatRecurrence(transaction.recurrence_rule)}</div>
                </div>
              </div>

              {transaction.note && (
                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Note:</strong> {transaction.note}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleToggleActive(transaction)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    transaction.is_active
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {transaction.is_active ? 'Deactivate' : 'Activate'}
                </button>
                
                <button
                  onClick={() => onEdit(transaction)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
