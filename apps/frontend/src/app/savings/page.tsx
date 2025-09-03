import { Suspense } from 'react';
import { Metadata } from 'next';
import { SavingsGoalsPage } from '@/features/savings/components/SavingsGoalsPage';

export const metadata: Metadata = {
  title: 'Savings Goals - Financial Manager',
  description: 'Track and manage your savings goals with progress monitoring and smart recommendations.',
};

export default function SavingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
        <p className="text-gray-600 mt-2">
          Track your progress, stay motivated, and achieve your financial dreams.
        </p>
      </div>
      
      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <SavingsGoalsPage />
      </Suspense>
    </div>
  );
}
