'use client';

import React, { useState, useEffect } from 'react';
import { financeApi } from '../../../lib/api/finance-api';
import type { TDebt } from '../../../types/finance';

interface DebtListProps {
  onEdit?: (debt: TDebt) => void;
  onDelete?: (debt: TDebt) => void;
  onAddPayment?: (debt: TDebt) => void;
  showActions?: boolean;
}

const DebtList: React.FC<DebtListProps> = ({
  onEdit,
  onDelete,
  onAddPayment,
  showActions = true
}) => {
  const [debts, setDebts] = useState<TDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'balance' | 'rate' | 'name' | 'due_date'>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getDebts();
      setDebts(response.data || []);
    } catch (err) {
      console.error('Error loading debts:', err);
      setError('Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedDebts = [...debts].sort((a, b) => {
    let aValue: any, bValue: any;
    
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
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getDebtTypeIcon = (type: TDebt['type']) => {
    switch (type) {
      case 'mortgage': return '🏠';
      case 'credit_card': return '💳';
      case 'loan': return '💰';
      case 'personal_debt': return '👤';
      case 'other': return '📄';
      default: return '💰';
    }
  };

  const getDebtTypeColor = (type: TDebt['type']) => {
    switch (type) {
      case 'mortgage': return 'bg-green-100 text-green-800';
      case 'credit_card': return 'bg-red-100 text-red-800';
      case 'loan': return 'bg-blue-100 text-blue-800';
      case 'personal_debt': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentFrequencyText = (frequency: TDebt['payment_frequency']) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  const calculatePayoffProgress = (debt: TDebt) => {
    if (debt.original_amount === 0) return 0;
    const paidAmount = debt.original_amount - debt.current_balance;
    return Math.max(0, Math.min(100, (paidAmount / debt.original_amount) * 100));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateMonthsRemaining = (debt: TDebt) => {
    if (!debt.end_date) return null;
    const now = new Date();
    const endDate = new Date(debt.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return Math.max(0, diffMonths);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadDebts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💳</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No debts found</h3>
        <p className="text-gray-600">
          Great job! You don't have any debts to track.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-sm text-gray-600">Sort by:</span>
        <div className="flex space-x-2">
          {[
            { key: 'balance', label: 'Balance' },
            { key: 'rate', label: 'Interest Rate' },
            { key: 'name', label: 'Name' },
            { key: 'due_date', label: 'Due Date' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => handleSort(option.key as typeof sortBy)}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === option.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {sortBy === option.key && (
                <span className="ml-1">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Debt List */}
      <div className="grid gap-4">
        {sortedDebts.map((debt) => {
          const progress = calculatePayoffProgress(debt);
          const monthsRemaining = calculateMonthsRemaining(debt);
          
          return (
            <div
              key={debt.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getDebtTypeIcon(debt.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDebtTypeColor(debt.type)}`}>
                      {debt.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {showActions && (
                  <div className="flex items-center space-x-2">
                    {onAddPayment && (
                      <button
                        onClick={() => onAddPayment(debt)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Add Payment
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(debt)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(debt)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Payoff Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Debt Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Current Balance</div>
                  <div className="font-semibold text-lg text-red-600">
                    {formatCurrency(debt.current_balance)}
                  </div>
                </div>

                <div>
                  <div className="text-gray-600">Original Amount</div>
                  <div className="font-medium">{formatCurrency(debt.original_amount)}</div>
                </div>

                <div>
                  <div className="text-gray-600">Interest Rate</div>
                  <div className="font-medium">{debt.interest_rate}% APR</div>
                </div>

                <div>
                  <div className="text-gray-600">Minimum Payment</div>
                  <div className="font-medium">{formatCurrency(debt.minimum_payment)}</div>
                </div>

                <div>
                  <div className="text-gray-600">Payment Frequency</div>
                  <div className="font-medium">{getPaymentFrequencyText(debt.payment_frequency)}</div>
                </div>

                <div>
                  <div className="text-gray-600">Start Date</div>
                  <div className="font-medium">{formatDate(debt.start_date)}</div>
                </div>

                <div>
                  <div className="text-gray-600">End Date</div>
                  <div className="font-medium">{formatDate(debt.end_date)}</div>
                </div>

                <div>
                  <div className="text-gray-600">Time Remaining</div>
                  <div className="font-medium">
                    {monthsRemaining !== null ? `${monthsRemaining} months` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {debt.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Notes</div>
                  <div className="text-sm">{debt.notes}</div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Paid: {formatCurrency(debt.original_amount - debt.current_balance)}
                  </div>
                  <div className="text-gray-600">
                    Remaining: {formatCurrency(debt.current_balance)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebtList;
