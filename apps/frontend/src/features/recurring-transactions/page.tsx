import { RecurringTransactionList } from './components/RecurringTransactionList';
import { getRecurringTransactionsWithAnalytics } from './actions';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

async function RecurringTransactionsData() {
  try {
    const transactions = await getRecurringTransactionsWithAnalytics({
      includePastDue: true
    });

    return <RecurringTransactionList initialData={transactions} />;
  } catch (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Recurring Transactions</h2>
          <p className="text-muted-foreground">
            Manage your recurring income and expenses
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Failed to load recurring transactions</h3>
            <p className="text-sm text-muted-foreground">
              There was an error loading your recurring transactions. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded w-48" />
        </div>
      </div>

      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded-full" />
                <div className="space-y-1">
                  <div className="h-3 bg-muted rounded w-12" />
                  <div className="h-5 bg-muted rounded w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-32" />
            <div className="flex items-center gap-2">
              <div className="h-10 bg-muted rounded w-32" />
              <div className="h-10 bg-muted rounded w-10" />
              <div className="h-10 bg-muted rounded w-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count Skeleton */}
      <div className="h-4 bg-muted rounded w-64" />

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-48" />
                    <div className="h-3 bg-muted rounded w-32" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-6 bg-muted rounded w-20" />
                    <div className="h-5 bg-muted rounded w-16" />
                  </div>
                </div>
                
                <div className="h-3 bg-muted rounded w-full" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="h-3 bg-muted rounded w-16" />
                    <div className="h-4 bg-muted rounded w-20" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-muted rounded w-16" />
                    <div className="h-4 bg-muted rounded w-24" />
                  </div>
                </div>
                
                <div className="h-px bg-muted" />
                
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center space-y-1">
                      <div className="h-3 bg-muted rounded w-12 mx-auto" />
                      <div className="h-4 bg-muted rounded w-8 mx-auto" />
                      <div className="h-2 bg-muted rounded w-16 mx-auto" />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 bg-muted rounded w-16" />
                    <div className="h-8 bg-muted rounded w-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 bg-muted rounded w-20" />
                    <div className="h-8 bg-muted rounded w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function RecurringTransactionsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <RecurringTransactionsData />
      </Suspense>
    </div>
  );
}
