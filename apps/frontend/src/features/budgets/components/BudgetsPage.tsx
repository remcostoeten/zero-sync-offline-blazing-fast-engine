'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BudgetList } from './BudgetList';
import {
  getBudgets,
  getBudgetsSummary,
  getBudgetAlerts,
  getBudgetInsights,
  createBudget,
  updateBudget,
  deleteBudget,
  refreshBudgetSpending,
  BudgetWithProgress,
} from '../actions';

interface BudgetsPageProps {
  // Optional props for testing or specific configurations
  initialData?: {
    budgets?: BudgetWithProgress[];
    summary?: any;
    alerts?: any;
    insights?: any;
  };
}

export function BudgetsPage({ initialData }: BudgetsPageProps = {}) {
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>(initialData?.budgets || []);
  const [summary, setSummary] = useState(initialData?.summary || null);
  const [alerts, setAlerts] = useState(initialData?.alerts || null);
  const [insights, setInsights] = useState(initialData?.insights || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        budgetsData,
        summaryData,
        alertsData,
        insightsData,
      ] = await Promise.all([
        getBudgets(),
        getBudgetsSummary(),
        getBudgetAlerts(),
        getBudgetInsights(),
      ]);

      setBudgets(budgetsData);
      setSummary(summaryData);
      setAlerts(alertsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load budgets:', error);
      setError('Failed to load budgets. Please try again.');
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data after mutations
  const refreshData = async () => {
    try {
      const [
        budgetsData,
        summaryData,
        alertsData,
        insightsData,
      ] = await Promise.all([
        getBudgets(),
        getBudgetsSummary(),
        getBudgetAlerts(),
        getBudgetInsights(),
      ]);

      setBudgets(budgetsData);
      setSummary(summaryData);
      setAlerts(alertsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Don't show error toast for refresh failures
    }
  };

  const handleCreateBudget = async (data: any) => {
    try {
      const newBudget = await createBudget(data);
      toast.success('Budget created successfully!');
      await refreshData();
    } catch (error) {
      console.error('Failed to create budget:', error);
      toast.error('Failed to create budget. Please try again.');
    }
  };

  const handleUpdateBudget = async (data: any) => {
    try {
      await updateBudget(data);
      toast.success('Budget updated successfully!');
      await refreshData();
    } catch (error) {
      console.error('Failed to update budget:', error);
      toast.error('Failed to update budget. Please try again.');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget({ id });
      toast.success('Budget deleted successfully!');
      await refreshData();
    } catch (error) {
      console.error('Failed to delete budget:', error);
      toast.error('Failed to delete budget. Please try again.');
    }
  };

  const handleRefreshBudget = async (id: string) => {
    try {
      await refreshBudgetSpending({ id });
      toast.success('Budget spending refreshed from transactions!');
      await refreshData();
    } catch (error) {
      console.error('Failed to refresh budget spending:', error);
      toast.error('Failed to refresh budget spending. Please try again.');
    }
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <BudgetList
      budgets={budgets}
      summary={summary}
      alerts={alerts}
      insights={insights}
      onCreateBudget={handleCreateBudget}
      onUpdateBudget={handleUpdateBudget}
      onDeleteBudget={handleDeleteBudget}
      onRefreshBudget={handleRefreshBudget}
      isLoading={isLoading}
    />
  );
}
