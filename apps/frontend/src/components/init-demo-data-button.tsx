'use client';

import { useState } from 'react';
import { initializeDemoData } from '@/app/actions/init-demo-data';

type TProps = {
  className?: string;
  variant?: 'default' | 'primary';
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

type TInitResponse = {
  success: boolean;
  message: string;
  summary?: {
    categories: number;
    transactions: number;
    budgets: number;
    savingsGoals: number;
    recurringTransactions: number;
    savingsTransactions: number;
  };
  error?: string;
};

export function InitDemoDataButton({ 
  className = '', 
  variant = 'primary',
  onSuccess,
  onError 
}: TProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; summary?: any } | null>(null);

  async function handleInitializeDemoData() {
    const confirmed = confirm(
      '🎭 Initialize Demo Data?\n\n' +
      'This will populate your database with:\n' +
      '• Sample categories (income & expenses)\n' +
      '• Realistic transaction history (3 months)\n' +
      '• Budget examples with spending data\n' +
      '• Savings goals and progress\n' +
      '• Recurring transactions (salary, rent)\n\n' +
      'This will clear existing data first. Continue?'
    );

    if (!confirmed) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      // Call our demo data initialization server action
      const result: TInitResponse = await initializeDemoData();

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message,
          summary: result.summary
        });
        onSuccess?.();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to initialize demo data'
        });
        onError?.(result.error || 'Failed to initialize demo data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setFeedback({
        type: 'error',
        message: errorMessage
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

  return (
    <div className="space-y-3">
      <button
        onClick={handleInitializeDemoData}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <svg 
              className="animate-spin h-4 w-4" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Initializing...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>🎭</span>
            <span>Initialize Demo Data</span>
          </span>
        )}
      </button>

      {feedback && (
        <div className={`
          p-4 rounded-md text-sm border
          ${feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 text-lg">
              {feedback.type === 'success' ? '🎉' : '❌'}
            </span>
            <div className="flex-1">
              <p className="font-medium">
                {feedback.type === 'success' ? 'Success!' : 'Error'}
              </p>
              <p className="text-xs mt-1">{feedback.message}</p>
              
              {feedback.type === 'success' && feedback.summary && (
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-xs">📊 Demo Data Created:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>📁 {feedback.summary.categories} categories</div>
                    <div>💰 {feedback.summary.transactions} transactions</div>
                    <div>📊 {feedback.summary.budgets} budgets</div>
                    <div>🎯 {feedback.summary.savingsGoals} savings goals</div>
                    <div>🔄 {feedback.summary.recurringTransactions} recurring</div>
                    <div>🏦 {feedback.summary.savingsTransactions} savings txns</div>
                  </div>
                </div>
              )}
              
              {feedback.type === 'success' && (
                <p className="text-xs mt-3 opacity-80">
                  🚀 Your app is now ready with realistic demo data!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
