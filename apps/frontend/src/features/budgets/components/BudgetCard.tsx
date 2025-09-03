'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  DollarSign,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BudgetWithProgress } from '../actions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface BudgetCardProps {
  budget: BudgetWithProgress;
  onEdit?: (budget: BudgetWithProgress) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  className?: string;
}

export function BudgetCard({ 
  budget, 
  onEdit, 
  onDelete, 
  onRefresh,
  className 
}: BudgetCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh(budget.id.toString());
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-orange-600';
      case 'over-budget': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressBarColor = () => {
    switch (budget.progress.healthStatus) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-orange-500';
      case 'over-budget': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (budget.progress.healthStatus) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'over-budget':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPeriodDisplay = (period: string) => {
    switch (period) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return period;
    }
  };

  return (
    <Card className={cn(
      'relative transition-all duration-200 hover:shadow-md',
      !budget.isActive && 'opacity-60',
      budget.progress.isOverBudget && 'border-red-200 bg-red-50/30',
      budget.progress.healthStatus === 'warning' && 'border-yellow-200 bg-yellow-50/30',
      className
    )}>
      {/* Priority indicator */}
      <div 
        className={cn(
          'absolute top-0 left-0 w-1 h-full rounded-l-lg',
          getPriorityColor(budget.priority || 'medium')
        )}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold text-white"
              style={{ backgroundColor: budget.color || budget.category.color }}
            >
              {budget.category.icon || '💰'}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{budget.name}</h3>
              {budget.description && (
                <p className="text-sm text-gray-600 mt-1">{budget.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-700">
                  {budget.category.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {getPeriodDisplay(budget.period)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={getPriorityVariant(budget.priority || 'medium')}>
              {budget.priority || 'medium'}
            </Badge>
            
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  getHealthStatusColor(budget.progress.healthStatus)
                )}
              >
                {budget.progress.healthStatus === 'over-budget' ? 'Over Budget' :
                 budget.progress.healthStatus === 'danger' ? 'Critical' :
                 budget.progress.healthStatus === 'warning' ? 'Warning' : 'Healthy'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className={cn('font-medium', getHealthStatusColor(budget.progress.healthStatus))}>
              {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.progress.totalBudget)}
            </span>
            <span className="font-bold">
              {budget.progress.percentage.toFixed(1)}%
              {budget.progress.isOverBudget && (
                <span className="text-red-600 ml-1">
                  (+{(budget.progress.percentage - 100).toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
          
          <Progress 
            value={Math.min(budget.progress.percentage, 100)} 
            className="h-3"
            style={{
              '--progress-background': getProgressBarColor()
            } as React.CSSProperties}
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatCurrency(budget.progress.remaining)} remaining</span>
            {budget.progress.daysLeft && (
              <span>{budget.progress.daysLeft} days left</span>
            )}
          </div>
        </div>

        {/* Budget Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-600">Budget Amount</div>
              <div className="font-medium">{formatCurrency(budget.amount)}</div>
              {budget.carryoverAmount && budget.carryoverAmount > 0 && (
                <div className="text-xs text-green-600">
                  +{formatCurrency(budget.carryoverAmount)} carryover
                </div>
              )}
            </div>
          </div>

          {budget.progress.averageSpendingPerDay && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-600">Daily Average</div>
                <div className="font-medium">
                  {formatCurrency(budget.progress.averageSpendingPerDay)}
                </div>
              </div>
            </div>
          )}

          {budget.progress.projectedSpending && (
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-600">Projected Total</div>
                <div className={cn(
                  'font-medium',
                  budget.progress.projectedSpending > budget.progress.totalBudget 
                    ? 'text-red-600' 
                    : 'text-green-600'
                )}>
                  {formatCurrency(budget.progress.projectedSpending)}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-600">Period</div>
              <div className="font-medium">{formatDate(budget.startDate)}</div>
              {budget.endDate && (
                <div className="text-xs text-gray-500">
                  to {formatDate(budget.endDate)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert Threshold Info */}
        {budget.progress.alertTriggered && (
          <div className={cn(
            'p-3 rounded-lg border text-sm',
            budget.progress.isOverBudget 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          )}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                {budget.progress.isOverBudget 
                  ? 'Budget Exceeded!' 
                  : 'Alert Threshold Reached'
                }
              </span>
            </div>
            <div className="mt-1">
              {budget.progress.isOverBudget ? (
                `You've overspent by ${formatCurrency((budget.spent || 0) - budget.progress.totalBudget)}`
              ) : (
                `You've reached ${(budget.alertThreshold || 0.8) * 100}% of your budget limit`
              )}
            </div>
          </div>
        )}

        {/* Auto-renewal Info */}
        {budget.autoRenew && (
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <RefreshCw className="w-3 h-3" />
            <span>Auto-renews for next {budget.period.replace('ly', '')}</span>
            {budget.rollover && (
              <span> • Unused budget carries over</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-gray-500">
            Created {formatDate(budget.createdAt)}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(budget)}
                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(budget.id.toString())}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
