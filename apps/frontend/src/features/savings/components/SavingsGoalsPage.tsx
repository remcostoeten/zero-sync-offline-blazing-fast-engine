'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SavingsGoalList } from './SavingsGoalList';
import {
  getSavingsGoals,
  getSavingsGoalsSummary,
  getSavingsGoalsAlerts,
  getRecommendedMonthlySavings,
  createSavingsGoal,
  updateSavingsGoal,
  updateSavingsProgress,
  deleteSavingsGoal,
  SavingsGoalWithProgress,
} from '../actions';

interface SavingsGoalsPageProps {
  // Optional props for testing or specific configurations
  initialData?: {
    goals?: SavingsGoalWithProgress[];
    summary?: any;
    alerts?: any;
    recommendations?: any;
  };
}

export function SavingsGoalsPage({ initialData }: SavingsGoalsPageProps = {}) {
  const [goals, setGoals] = useState<SavingsGoalWithProgress[]>(initialData?.goals || []);
  const [summary, setSummary] = useState(initialData?.summary || null);
  const [alerts, setAlerts] = useState(initialData?.alerts || null);
  const [recommendations, setRecommendations] = useState(initialData?.recommendations || null);
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
        goalsData,
        summaryData,
        alertsData,
        recommendationsData,
      ] = await Promise.all([
        getSavingsGoals(),
        getSavingsGoalsSummary(),
        getSavingsGoalsAlerts(),
        getRecommendedMonthlySavings(),
      ]);

      setGoals(goalsData);
      setSummary(summaryData);
      setAlerts(alertsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
      setError('Failed to load savings goals. Please try again.');
      toast.error('Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data after mutations
  const refreshData = async () => {
    try {
      const [
        goalsData,
        summaryData,
        alertsData,
        recommendationsData,
      ] = await Promise.all([
        getSavingsGoals(),
        getSavingsGoalsSummary(),
        getSavingsGoalsAlerts(),
        getRecommendedMonthlySavings(),
      ]);

      setGoals(goalsData);
      setSummary(summaryData);
      setAlerts(alertsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Don't show error toast for refresh failures
    }
  };

  const handleCreateGoal = async (data: any) => {
    try {
      const newGoal = await createSavingsGoal(data);
      toast.success('Savings goal created successfully!');
      await refreshData();
    } catch (error) {
      console.error('Failed to create savings goal:', error);
      toast.error('Failed to create savings goal. Please try again.');
    }
  };

  const handleUpdateGoal = async (data: any) => {
    try {
      await updateSavingsGoal(data);
      toast.success('Savings goal updated successfully!');
      await refreshData();
    } catch (error) {
      console.error('Failed to update savings goal:', error);
      toast.error('Failed to update savings goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteSavingsGoal({ id });
      toast.success('Savings goal deleted successfully!');
      await refreshData();
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
      toast.error('Failed to delete savings goal. Please try again.');
    }
  };

  const handleUpdateProgress = async (id: string, amount: number, type: 'deposit' | 'withdrawal') => {
    try {
      const updatedGoal = await updateSavingsProgress({ id, amount, type });
      
      // Show appropriate success message
      if (type === 'deposit') {
        toast.success(`Added ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to your savings goal!`);
        
        // Check if goal was completed
        if (updatedGoal.isCompleted) {
          toast.success('🎉 Congratulations! You completed your savings goal!', {
            duration: 5000,
          });
        }
      } else {
        toast.success(`Removed ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} from your savings goal.`);
      }
      
      await refreshData();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress. Please try again.');
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
    <SavingsGoalList
      goals={goals}
      summary={summary}
      alerts={alerts}
      recommendations={recommendations}
      onCreateGoal={handleCreateGoal}
      onUpdateGoal={handleUpdateGoal}
      onDeleteGoal={handleDeleteGoal}
      onUpdateProgress={handleUpdateProgress}
      isLoading={isLoading}
    />
  );
}
