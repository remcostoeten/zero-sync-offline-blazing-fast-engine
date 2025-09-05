'use client';

import { useState } from 'react';
import { clearAllDemoData } from '@/app/actions/clear-demo-data';

type TProps = {
  className?: string;
  variant?: 'default' | 'destructive';
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export function ClearDemoDataButton({ 
  className = '', 
  variant = 'destructive',
  onSuccess,
  onError 
}: TProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleClearData() {
    const confirmed = confirm(
      '⚠️ Are you sure you want to clear ALL demo data?\n\n' +
      'This will permanently delete:\n' +
      '• All categories\n' +
      '• All transactions\n' +
      '• All budgets\n' +
      '• All savings goals\n' +
      '• All recurring transactions\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await clearAllDemoData();

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message
        });
        onSuccess?.();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to clear demo data'
        });
        onError?.(result.error || 'Failed to clear demo data');
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
  const variantClasses = variant === 'destructive' 
    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

  return (
    <div className="space-y-2">
      <button
        onClick={handleClearData}
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
            <span>Clearing...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>🧹</span>
            <span>Clear All Demo Data</span>
          </span>
        )}
      </button>

      {feedback && (
        <div className={`
          p-3 rounded-md text-sm border
          ${feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0">
              {feedback.type === 'success' ? '✅' : '❌'}
            </span>
            <div>
              <p className="font-medium">
                {feedback.type === 'success' ? 'Success!' : 'Error'}
              </p>
              <p className="text-xs mt-1">{feedback.message}</p>
              {feedback.type === 'success' && (
                <p className="text-xs mt-2 opacity-80">
                  💡 Run <code className="bg-green-100 px-1 rounded">bun run init:demo</code> to restore demo data
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
