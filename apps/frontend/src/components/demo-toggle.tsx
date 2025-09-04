'use client';

import { useState, useEffect } from 'react';

type TProps = {
  className?: string;
  showStats?: boolean;
  onToggle?: (isDemoMode: boolean) => void;
};

type TDemoStatus = {
  isDemoMode: boolean;
  userId: number;
  description: string;
  stats: {
    categories: number;
    transactions: number;
  };
  lastUpdated: string;
};

type TApiResponse = {
  success: boolean;
  data: TDemoStatus;
  message?: string;
  error?: {
    message: string;
    details?: string;
  };
};

export function DemoToggle({ className = '', showStats = true, onToggle }: TProps) {
  const [demoStatus, setDemoStatus] = useState<TDemoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  async function fetchDemoStatus() {
    try {
      setError(null);
      const response = await fetch(`${backendUrl}/api/finance/demo-toggle`);
      const result: TApiResponse = await response.json();
      
      if (result.success) {
        setDemoStatus(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch demo status');
      }
    } catch (err) {
      setError('Network error: Could not connect to backend');
      console.error('Error fetching demo status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDemoMode(clearUserData: boolean = false) {
    if (!demoStatus) return;

    setToggling(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/finance/demo-toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: demoStatus.userId,
          clearUserData
        }),
      });

      const result: TApiResponse = await response.json();
      
      if (result.success) {
        setDemoStatus(result.data);
        onToggle?.(result.data.isDemoMode);
        setShowConfirmDialog(false);
      } else {
        setError(result.error?.message || 'Failed to toggle demo mode');
      }
    } catch (err) {
      setError('Network error: Could not connect to backend');
      console.error('Error toggling demo mode:', err);
    } finally {
      setToggling(false);
    }
  }

  function handleToggleClick() {
    if (!demoStatus) return;

    if (!demoStatus.isDemoMode && demoStatus.stats.categories + demoStatus.stats.transactions > 0) {
      setShowConfirmDialog(true);
    } else {
      toggleDemoMode();
    }
  }

  useEffect(() => {
    fetchDemoStatus();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading demo settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`}>
        <div className="flex items-center">
          <span className="text-red-600 text-sm">⚠️ {error}</span>
          <button
            onClick={fetchDemoStatus}
            className="ml-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!demoStatus) {
    return null;
  }

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                demoStatus.isDemoMode 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {demoStatus.isDemoMode ? '🎭 Demo Mode' : '✅ Real Data'}
              </span>
              
              <button
                onClick={handleToggleClick}
                disabled={toggling}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  demoStatus.isDemoMode ? 'bg-orange-600' : 'bg-gray-200'
                } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    demoStatus.isDemoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {toggling && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Switching modes...</span>
              </div>
            )}
          </div>

          {showStats && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <span>📁</span>
                <span>{demoStatus.stats.categories} categories</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💳</span>
                <span>{demoStatus.stats.transactions} transactions</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          {demoStatus.isDemoMode ? (
            <p>📊 Using sample data to showcase app features. Switch off to use your real financial data.</p>
          ) : (
            <p>💼 Using your real financial data. Switch on to explore with sample data.</p>
          )}
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚠️ Switch to Demo Mode?
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You currently have <strong>{demoStatus.stats.categories} categories</strong> and{' '}
                <strong>{demoStatus.stats.transactions} transactions</strong> in your account.
              </p>
              
              <p className="text-gray-600 mb-4">
                Switching to demo mode will:
              </p>
              
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                <li>Load comprehensive sample financial data</li>
                <li>Allow you to explore all app features safely</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Your real data will be preserved.</strong> You can switch back anytime to return to your actual financial data.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={toggling}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={() => toggleDemoMode(false)}
                disabled={toggling}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {toggling ? 'Switching...' : 'Enable Demo Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
