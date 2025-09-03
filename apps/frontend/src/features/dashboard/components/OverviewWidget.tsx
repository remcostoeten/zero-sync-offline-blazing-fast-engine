'use client';

import { DashboardOverview } from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  Target,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OverviewWidgetProps {
  data: DashboardOverview;
  isLoading?: boolean;
}

export function OverviewWidget({ data, isLoading }: OverviewWidgetProps) {
  if (isLoading) {
    return (
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
    );
  }

  const metrics = [
    {
      title: 'Total Balance',
      value: formatCurrency(data.totalBalance),
      description: 'Overall account balance',
      icon: Wallet,
      color: data.totalBalance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data.totalBalance >= 0 ? 'bg-green-50' : 'bg-red-50',
      trend: data.totalBalance >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(data.monthlyIncome),
      description: 'This month',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'positive'
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(data.monthlyExpenses),
      description: 'This month',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'negative'
    },
    {
      title: 'Net Cash Flow',
      value: formatCurrency(data.netCashFlow),
      description: 'Income - Expenses',
      icon: DollarSign,
      color: data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data.netCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50',
      trend: data.netCashFlow >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Total Savings',
      value: formatCurrency(data.totalSavings),
      description: 'All savings goals',
      icon: PiggyBank,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'neutral'
    },
    {
      title: 'Active Budgets',
      value: data.activeBudgets.toString(),
      description: 'Currently tracking',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'neutral'
    },
    {
      title: 'Savings Progress',
      value: `${data.savingsGoalsProgress.toFixed(1)}%`,
      description: 'Goals completed',
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: 'positive'
    },
    {
      title: 'Due Transactions',
      value: data.overdueTransactions.toString(),
      description: 'Recurring items',
      icon: data.overdueTransactions > 0 ? AlertTriangle : Calendar,
      color: data.overdueTransactions > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: data.overdueTransactions > 0 ? 'bg-orange-50' : 'bg-gray-50',
      trend: data.overdueTransactions > 0 ? 'warning' : 'neutral'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Financial Overview</h2>
        <Badge variant="outline" className="text-xs">
          {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    metric.bgColor
                  )}>
                    <Icon className={cn('w-5 h-5', metric.color)} />
                  </div>
                  {metric.trend === 'positive' && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                  {metric.trend === 'negative' && (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  {metric.trend === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    metric.color
                  )}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
