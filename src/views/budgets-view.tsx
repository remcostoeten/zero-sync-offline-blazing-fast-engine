import React, { useState } from 'react';
import { BudgetList } from '../components/finance/budgets/budget-list';
import { BudgetForm } from '../components/finance/budgets/budget-form';
import type { TBudget, TBudgetFormData, TApiResponse } from '../types/finance';

type TProps = {
  api: any;
};

export function BudgetsView({ api }: TProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<TBudget | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  async function handleCreateBudget(formData: TBudgetFormData) {
    try {
      const response: TApiResponse<any> = await api.createBudget({
        categoryId: parseInt(formData.categoryId),
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined
      });

      if (response.success) {
        setShowForm(false);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to create budget:', err);
      throw err;
    }
  }

  async function handleUpdateBudget(formData: TBudgetFormData) {
    if (!editingBudget) return;

    try {
      const response: TApiResponse<any> = await api.updateBudget(editingBudget.id, {
        categoryId: parseInt(formData.categoryId),
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined
      });

      if (response.success) {
        setShowForm(false);
        setEditingBudget(null);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to update budget:', err);
      throw err;
    }
  }

  async function handleDeleteBudget(id: number) {
    try {
      const response: TApiResponse<any> = await api.deleteBudget(id);
      if (response.success) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  }

  function handleEditBudget(budget: TBudget) {
    setEditingBudget(budget);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingBudget(null);
  }

  function handleAddNew() {
    setEditingBudget(null);
    setShowForm(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Budget Management</h1>
              <p className="text-gray-600 mt-2">Track and manage your spending limits by category</p>
            </div>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Budget
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {showForm && (
            <BudgetForm
              budget={editingBudget}
              onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
              onCancel={handleCancelForm}
              api={api}
            />
          )}

          <BudgetList
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
            api={api}
            key={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}

export default BudgetsView;
