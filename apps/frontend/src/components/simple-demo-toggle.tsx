'use client';

import { useState, useEffect } from 'react';

type TProps = {
  className?: string;
  showStats?: boolean;
  onToggle?: (isDemoMode: boolean) => void;
};

type TDemoStatus = {
  isDemoMode: boolean;
  description: string;
  stats: {
    categories: number;
    transactions: number;
  };
};

export function SimpleDemoToggle({ className = '', showStats = true, onToggle }: TProps) {
  const [demoStatus, setDemoStatus] = useState<TDemoStatus>({
    isDemoMode: true, // Assume demo mode since we have demo data
    description: 'Demo mode with sample financial data',
    stats: {
      categories: 11,
      transactions: 42
    }
  });
  const [loading, setLoading] = useState(false);

  function handleToggleClick() {
    if (demoStatus.isDemoMode) {
      // Switching to real data
      const confirmed = confirm(
        '⚠️ Switch to Real Data Mode?\n\n' +
        'This will hide the demo data and show your actual financial data.\n' +
        'You can switch back to demo mode anytime to continue exploring.\n\n' +
        'Continue?'
      );
      
      if (confirmed) {
        alert(
          '📋 To switch to real data:\n\n' +
          '1. Use the "Clear All Demo Data" button in Settings\n' +
          '2. Add your own categories and transactions\n' +
          '3. Or import your existing financial data\n\n' +
          'For now, you can explore with the demo data!'
        );
      }
    } else {
      // Switching to demo mode - use bun script
      alert(
        '🎭 To restore demo data:\n\n' +
        'Run this command in your terminal:\n' +
        'bun run init:demo\n\n' +
        'This will populate the database with sample financial data.'
      );
    }
    
    onToggle?.(demoStatus.isDemoMode);
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading demo settings...</span>
      </div>
    );
  }

  return (
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
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                demoStatus.isDemoMode ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  demoStatus.isDemoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
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
          <p>📊 Using sample data to showcase app features. Use &quot;Clear Demo Data&quot; button below to start fresh.</p>
        ) : (
          <p>💼 Using your real financial data. Run &quot;bun run init:demo&quot; to restore sample data.</p>
        )}
      </div>
    </div>
  );
}
