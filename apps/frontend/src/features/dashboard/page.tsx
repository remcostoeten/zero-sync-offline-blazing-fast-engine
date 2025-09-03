import { Suspense } from 'react';
import { 
  getDashboardOverview,
  getRecentTransactions,
  getBudgetProgress,
  getSavingsProgress,
  getFinancialInsights
} from './actions';
import { OverviewWidget } from './components/OverviewWidget';
import { RecentTransactionsWidget } from './components/RecentTransactionsWidget';
import { BudgetProgressWidget } from './components/BudgetProgressWidget';
import { SavingsGoalsWidget } from './components/SavingsGoalsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

async function DashboardData() {
  try {
    const [
      overview,
      recentTransactions,
      budgetProgress,
      savingsProgress,
      insights
    ] = await Promise.all([
      getDashboardOverview(),
      getRecentTransactions(8),
      getBudgetProgress(),
      getSavingsProgress(),
      getFinancialInsights()
    ]);

    return (
      <div className="space-y-8">
        {/* Financial Overview */}
        <OverviewWidget data={overview} />

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Financial Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Top Spending Category</p>
                <p className="font-semibold">{insights.topSpendingCategory}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Daily Spending</p>
                <p className="font-semibold">{formatCurrency(insights.averageDailySpending)}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${
                    insights.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {insights.savingsRate.toFixed(1)}%
                  </p>
                  {insights.savingsRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Budget Alerts</p>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${
                    insights.budgetAlerts > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {insights.budgetAlerts}
                  </p>
                  {insights.budgetAlerts > 0 && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                <p className="font-semibold">
                  {formatCurrency(insights.recurringTransactionsValue)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  <span>Just now</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Transactions */}
          <div className="lg:col-span-2 space-y-8">
            <RecentTransactionsWidget transactions={recentTransactions} />
          </div>

          {/* Right Column - Progress Widgets */}
          <div className="space-y-8">
            <BudgetProgressWidget budgets={budgetProgress} />
            <SavingsGoalsWidget goals={savingsProgress} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
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
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your financial overview and key insights
          </p>
        </div>

        {/* Dashboard Content */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardData />
        </Suspense>
      </div>
    </div>
  );
}
