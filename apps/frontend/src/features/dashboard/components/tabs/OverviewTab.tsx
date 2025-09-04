'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  RefreshCw,
  DollarSign,
  Target,
  PiggyBank,
  CreditCard
} from 'lucide-react';
import { OverviewWidget } from '../OverviewWidget';
import { RecentTransactionsWidget } from '../RecentTransactionsWidget';
import { BudgetProgressWidget } from '../BudgetProgressWidget';
import { SavingsGoalsWidget } from '../SavingsGoalsWidget';
import { formatCurrency } from '@/lib/utils';

type TProps = {
  overview: any;
  recentTransactions: any[];
  budgetProgress: any[];
  savingsProgress: any[];
  insights: any;
  trends?: any[];
};

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  variant = 'default' 
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  variant?: 'default' | 'income' | 'expense' | 'transfer';
}) {
  const variantStyles = {
    default: 'hover:bg-muted',
    income: 'hover:bg-green-50 hover:border-green-200',
    expense: 'hover:bg-red-50 hover:border-red-200',
    transfer: 'hover:bg-blue-50 hover:border-blue-200'
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    income: 'text-green-600',
    expense: 'text-red-600',
    transfer: 'text-blue-600'
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${variantStyles[variant]}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background">
            <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function CashFlowSummary({ insights, trends }: { insights: any, trends?: any[] }) {
  const cashFlowTrend = trends?.[trends.length - 1]?.net || 0;
  const isPositive = cashFlowTrend >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-500" />
          Cash Flow Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(insights.totalIncome || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Income</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(insights.totalExpenses || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
          </div>
          
          <div className="text-center">
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(cashFlowTrend)}
            </p>
            <div className="flex items-center justify-center gap-1">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">Net Flow</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {insights.savingsRate?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-xs text-muted-foreground">Savings Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    {
      id: 'add-income',
      title: 'Add Income',
      description: 'Record new income',
      icon: Plus,
      variant: 'income' as const
    },
    {
      id: 'add-expense',
      title: 'Add Expense',
      description: 'Record new expense',
      icon: Plus,
      variant: 'expense' as const
    },
    {
      id: 'transfer',
      title: 'Transfer',
      description: 'Move between accounts',
      icon: ArrowUpRight,
      variant: 'transfer' as const
    },
    {
      id: 'add-goal',
      title: 'New Goal',
      description: 'Create savings goal',
      icon: Target,
      variant: 'default' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <QuickActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              variant={action.variant}
              onClick={() => onAction(action.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewTab({ 
  overview, 
  recentTransactions, 
  budgetProgress, 
  savingsProgress, 
  insights,
  trends 
}: TProps) {
  function handleQuickAction(actionId: string) {
    // TODO: Implement quick action handlers
    console.log('Quick action:', actionId);
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Financial Overview */}
      <OverviewWidget data={overview} />

      {/* Cash Flow Summary */}
      <CashFlowSummary insights={insights} trends={trends} />

      {/* Enhanced Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Top Spending Category</p>
              <p className="font-semibold">{insights.topSpendingCategory}</p>
              <Badge variant="outline" className="text-xs">
                This Month
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average Daily Spending</p>
              <p className="font-semibold">{formatCurrency(insights.averageDailySpending)}</p>
              <Badge variant="outline" className="text-xs">
                Last 30 Days
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${
                  insights.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {insights.savingsRate?.toFixed(1) || '0.0'}%
                </p>
                {(insights.savingsRate || 0) >= 0 ? (
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
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
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
        {/* Left Column - Recent Transactions and Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <RecentTransactionsWidget transactions={recentTransactions} />
          <QuickActions onAction={handleQuickAction} />
        </div>

        {/* Right Column - Progress Widgets */}
        <div className="space-y-8">
          <BudgetProgressWidget budgets={budgetProgress} />
          <SavingsGoalsWidget goals={savingsProgress} />
        </div>
      </div>
    </div>
  );
}
