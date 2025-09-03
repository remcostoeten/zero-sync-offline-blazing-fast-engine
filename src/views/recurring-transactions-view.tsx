import React, { useState } from 'react';
import { RecurringTransactionList } from '../components/finance/recurring/recurring-list';
import { RecurringTransactionForm } from '../components/finance/recurring/recurring-form';
import type { TRecurringTransaction, TRecurringTransactionFormData, TApiResponse } from '../types/finance';

type TProps = {
  api: any;
};

export function RecurringTransactionsView({ api }: TProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TRecurringTransaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  async function handleCreateTransaction(formData: TRecurringTransactionFormData) {
    try {
      const response: TApiResponse<any> = await api.createRecurringTransaction({
        name: formData.name,
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        recurrenceRule: formData.recurrenceRule,
        nextDueDate: formData.nextDueDate,
        note: formData.note || undefined
      });

      if (response.success) {
        setShowForm(false);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to create recurring transaction:', err);
      throw err;
    }
  }

  async function handleUpdateTransaction(formData: TRecurringTransactionFormData) {
    if (!editingTransaction) return;

    try {
      const response: TApiResponse<any> = await api.updateRecurringTransaction(editingTransaction.id, {
        name: formData.name,
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        recurrenceRule: formData.recurrenceRule,
        nextDueDate: formData.nextDueDate,
        note: formData.note || undefined
      });

      if (response.success) {
        setShowForm(false);
        setEditingTransaction(null);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to update recurring transaction:', err);
      throw err;
    }
  }

  async function handleDeleteTransaction(id: number) {
    try {
      const response: TApiResponse<any> = await api.deleteRecurringTransaction(id);
      if (response.success) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to delete recurring transaction:', err);
    }
  }

  function handleEditTransaction(transaction: TRecurringTransaction) {
    setEditingTransaction(transaction);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingTransaction(null);
  }

  function handleAddNew() {
    setEditingTransaction(null);
    setShowForm(true);
  }

  function handleToggleActive(id: number, isActive: boolean) {
    setRefreshTrigger(prev => prev + 1);
  }

  function handleGenerate() {
    setRefreshTrigger(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔄 Recurring Transactions</h1>
              <p className="text-gray-600 mt-2">Automate your regular income and expenses</p>
            </div>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Recurring Transaction
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {showForm && (
            <RecurringTransactionForm
              transaction={editingTransaction}
              onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
              onCancel={handleCancelForm}
              api={api}
            />
          )}

          <RecurringTransactionList
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onToggleActive={handleToggleActive}
            onGenerate={handleGenerate}
            api={api}
            key={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}

export default RecurringTransactionsView;
