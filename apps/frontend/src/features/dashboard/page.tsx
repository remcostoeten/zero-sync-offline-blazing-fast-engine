import { Suspense } from 'react';
import { 
  getDashboardOverview,
  getRecentTransactions,
  getBudgetProgress,
  getSavingsProgress,
  getFinancialInsights,
  getSpendingTrends
} from './actions';
import { getTransactions } from '../transactions/actions';
import { getCategories } from '../categories/actions';
import { getRecurringTransactions } from '../recurring-transactions/actions';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

async function DashboardData() {
  try {
    const [
      overview,
      recentTransactions,
      budgetProgress,
      savingsProgress,
      insights,
      trends,
      // History data
      allTransactions,
      categories,
      // Recurring data
      recurringTransactions
    ] = await Promise.all([
      getDashboardOverview(),
      getRecentTransactions(8),
      getBudgetProgress(),
      getSavingsProgress(),
      getFinancialInsights(),
      getSpendingTrends(30),
      // History data
      getTransactions({ limit: 50 }),
      getCategories(),
      // Recurring data
      getRecurringTransactions()
    ]);

    // Calculate notification counts
    const notificationCount = insights.budgetAlerts || 0;
    const upcomingRecurringCount = 0; // TODO: Calculate from recurring transactions
    
    // Mock upcoming transactions for now
    const upcomingTransactions = [];

    return (
      <EnhancedDashboard
        // Overview data
        overview={overview}
        recentTransactions={recentTransactions}
        budgetProgress={budgetProgress}
        savingsProgress={savingsProgress}
        insights={insights}
        trends={trends}
        // History data
        allTransactions={allTransactions.transactions || []}
        categories={categories}
        totalTransactionCount={allTransactions.totalCount || 0}
        // Recurring data
        recurringTransactions={recurringTransactions || []}
        upcomingTransactions={upcomingTransactions}
        // Notification counts
        notificationCount={notificationCount}
        upcomingRecurringCount={upcomingRecurringCount}
      />
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="font-medium mb-2">Failed to load dashboard</h3>
            <p className="text-sm text-muted-foreground">
              There was an error loading your dashboard data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Overview Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-6 bg-muted rounded w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-8 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Insights Skeleton */}
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-5 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-muted rounded w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-24" />
                        <div className="h-5 bg-muted rounded w-12" />
                      </div>
                      <div className="h-2 bg-muted rounded w-full" />
                      <div className="flex justify-between">
                        <div className="h-3 bg-muted rounded w-16" />
                        <div className="h-3 bg-muted rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
