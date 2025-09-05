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
import { BudgetWithUtilization } from '../api-actions';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';

interface BudgetCardProps {
  budget: BudgetWithUtilization;
  onEdit?: (budget: BudgetWithUtilization) => void;
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
      case 'on_track': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'exceeded': return 'text-red-600';
      case 'completed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressBarColor = () => {
    switch (budget.status) {
      case 'on_track': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'exceeded': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (budget.status) {
      case 'on_track':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'exceeded':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
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
      budget.status === 'exceeded' && 'border-red-500/50 bg-destructive/5',
      budget.status === 'warning' && 'border-yellow-500/50 bg-yellow-500/5',
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
              style={{ backgroundColor: budget.categoryColor || '#3B82F6' }}
            >
              {budget.categoryIcon || '💰'}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{budget.categoryName}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-foreground">
                  {budget.categoryName}
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
                  getHealthStatusColor(budget.status)
                )}
              >
                {budget.status === 'exceeded' ? 'Over Budget' :
                 budget.status === 'warning' ? 'Warning' : 
                 budget.status === 'completed' ? 'Completed' : 'On Track'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className={cn('font-medium', getHealthStatusColor(budget.status))}>
              {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.amount)}
            </span>
            <span className="font-bold">
              {budget.percentageUsed.toFixed(1)}%
              {budget.status === 'exceeded' && (
                <span className="text-red-600 ml-1">
                  (+{(budget.percentageUsed - 100).toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
          
          <Progress 
            value={Math.min(budget.percentageUsed, 100)} 
            className="h-3"
            style={{
              '--progress-background': getProgressBarColor()
            } as React.CSSProperties}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(budget.remainingAmount)} remaining</span>
            {budget.daysRemaining && (
              <span>{budget.daysRemaining} days left</span>
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
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-600">Spent Amount</div>
              <div className="font-medium">
                {formatCurrency(budget.spentAmount)}
              </div>
            </div>
          </div>

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
        {(budget.status === 'exceeded' || budget.status === 'warning') && (
          <div className={cn(
            'p-3 rounded-lg border text-sm',
            budget.status === 'exceeded'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          )}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                {budget.status === 'exceeded' 
                  ? 'Budget Exceeded!' 
                  : 'Alert Threshold Reached'
                }
              </span>
            </div>
            <div className="mt-1">
              {budget.status === 'exceeded' ? (
                `You've overspent by ${formatCurrency(budget.spentAmount - budget.amount)}`
              ) : (
                `You've reached ${budget.percentageUsed.toFixed(1)}% of your budget limit`
              )}
            </div>
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
