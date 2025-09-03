'use client';

import { RecurringTransactionWithAnalytics } from '../actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarDays, 
  Clock, 
  DollarSign, 
  Repeat, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface RecurringTransactionCardProps {
  transaction: RecurringTransactionWithAnalytics;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number, isActive: boolean) => void;
}

export function RecurringTransactionCard({
  transaction,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}: RecurringTransactionCardProps) {
  const { analytics } = transaction;
  
  const isOverdue = analytics.isOverdue;
  const isDueSoon = analytics.daysUntilNext !== undefined && analytics.daysUntilNext >= 0 && analytics.daysUntilNext <= 7;

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly', 
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly'
  };

  const typeColors = {
    income: 'text-green-600 bg-green-50 border-green-200',
    expense: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isOverdue && 'border-red-300 bg-red-50/30',
      isDueSoon && 'border-yellow-300 bg-yellow-50/30',
      !transaction.isActive && 'opacity-60'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{transaction.name}</h3>
              <Badge 
                variant={transaction.isActive ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  transaction.isActive ? 'bg-green-100 text-green-800' : ''
                )}
              >
                {transaction.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: transaction.category.color }}
              />
              <span>{transaction.category.name}</span>
            </div>
          </div>

          <div className="text-right">
            <div className={cn(
              'text-2xl font-bold mb-1',
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            )}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
            <Badge variant="outline" className={typeColors[transaction.type]}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {transaction.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {transaction.description}
          </p>
        )}

        {/* Frequency and Schedule Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Repeat className="w-4 h-4" />
              <span>Frequency</span>
            </div>
            <p className="font-medium">
              {frequencyLabels[transaction.frequency]}
              {transaction.interval > 1 && ` (every ${transaction.interval})`}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>Next Due</span>
            </div>
            {analytics.nextDueDate ? (
              <div className="space-y-1">
                <p className="font-medium">{analytics.nextDueDate}</p>
                {analytics.daysUntilNext !== undefined && (
                  <p className={cn(
                    'text-xs',
                    isOverdue && 'text-red-600 font-medium',
                    isDueSoon && 'text-yellow-600 font-medium'
                  )}>
                    {isOverdue 
                      ? `Overdue by ${Math.abs(analytics.daysUntilNext)} days`
                      : analytics.daysUntilNext === 0 
                        ? 'Due today' 
                        : `${analytics.daysUntilNext} days`
                    }
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Not scheduled</p>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        {(isOverdue || isDueSoon) && (
          <div className="flex items-center gap-2 p-2 rounded-md mb-3 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {isOverdue && (
              <span className="text-red-700 bg-red-100 px-2 py-1 rounded">
                Transaction overdue - should auto-generate
              </span>
            )}
            {isDueSoon && !isOverdue && (
              <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                Due soon - transaction will generate in {analytics.daysUntilNext} days
              </span>
            )}
          </div>
        )}

        <Separator className="my-3" />

        {/* Analytics Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              <span>Generated</span>
            </div>
            <p className="font-semibold">{analytics.totalGenerated}</p>
            <p className="text-xs text-muted-foreground">transactions</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Total</span>
            </div>
            <p className="font-semibold">{formatCurrency(analytics.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">generated</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Monthly Est.</span>
            </div>
            <p className="font-semibold">{formatCurrency(analytics.estimatedMonthlyTotal)}</p>
            <p className="text-xs text-muted-foreground">estimated</p>
          </div>
        </div>

        {/* Additional Transaction Info */}
        {(transaction.payee || transaction.tags?.length > 0) && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              {transaction.payee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payee:</span>
                  <span className="font-medium">{transaction.payee}</span>
                </div>
              )}
              {transaction.tags && transaction.tags.length > 0 && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-muted-foreground">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {transaction.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(transaction.id)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(transaction.id)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus?.(transaction.id, !transaction.isActive)}
              className={cn(
                transaction.isActive 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-green-600 hover:text-green-700'
              )}
            >
              {transaction.isActive ? (
                <>
                  <PowerOff className="w-4 h-4 mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-1" />
                  Activate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(transaction.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
