import React, { useState, useEffect } from 'react';
import type { TBudget, TApiListResponse } from '../../../types/finance';

type TProps = {
  onEdit: (budget: TBudget) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  api: any;
};

export function BudgetList({ onEdit, onDelete, onRefresh, api }: TProps) {
  const [budgets, setBudgets] = useState<TBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  async function loadBudgets() {
    try {
      setLoading(true);
      const response: TApiListResponse<TBudget> = await api.getBudgets();
      if (response.success && response.data) {
        setBudgets(response.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      onDelete(id);
      loadBudgets();
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'on_track': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'exceeded': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'exceeded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getProgressBarColor(status: string) {
    switch (status) {
      case 'on_track': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'exceeded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Loading budgets...</div>
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
            loadBudgets();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No budgets found</div>
        <div className="text-gray-400 text-sm mt-2">
          Create your first budget to start tracking your spending
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <div
            key={budget.id}
            className="bg-white rounded-lg shadow-md border-l-4 hover:shadow-lg transition-shadow duration-200"
            style={{ borderLeftColor: budget.category_color }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{budget.category_icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{budget.category_name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(budget.status)}`}>
                      {budget.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Budget</div>
                    <div className="font-semibold">${budget.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Period</div>
                    <div className="font-medium capitalize">{budget.period}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent: ${budget.spent_amount.toFixed(2)}</span>
                    <span className={getStatusColor(budget.status)}>
                      {budget.percentage_used.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budget.status)}`}
                      style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Remaining: ${budget.remaining_amount.toFixed(2)}</span>
                    <span>
                      {budget.end_date ? 
                        `Until ${new Date(budget.end_date).toLocaleDateString()}` :
                        'Ongoing'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => onEdit(budget)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
