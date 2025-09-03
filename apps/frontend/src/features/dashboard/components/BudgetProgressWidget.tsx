'use client';

import { BudgetProgress } from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BudgetProgressWidgetProps {
  budgets: BudgetProgress[];
  isLoading?: boolean;
}

export function BudgetProgressWidget({ 
  budgets, 
  isLoading 
}: BudgetProgressWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Budget Progress
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-16" />
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
    );
  }

  // Sort budgets to show over-budget and high utilization first
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.isOverBudget && !b.isOverBudget) return -1;
    if (!a.isOverBudget && b.isOverBudget) return 1;
    return b.percentage - a.percentage;
  }).slice(0, 5); // Show top 5 budgets

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Budget Progress
          <Link href="/budgets">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedBudgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2" />
              <p>No active budgets</p>
              <p className="text-sm">Create budgets to track your spending</p>
            </div>
          ) : (
            sortedBudgets.map((budget) => {
              const isNearLimit = budget.percentage >= (budget.alertThreshold * 100);
              const progressColor = budget.isOverBudget 
                ? 'bg-red-500' 
                : isNearLimit 
                  ? 'bg-yellow-500'
                  : 'bg-green-500';

              return (
                <div key={budget.budgetId} className="space-y-3">
                  {/* Budget Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.categoryColor }}
                      />
                      <div>
                        <p className="font-medium text-sm">{budget.budgetName}</p>
                        <p className="text-xs text-muted-foreground">
                          {budget.categoryName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {budget.isOverBudget && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge 
                        variant={budget.isOverBudget ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {budget.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(budget.percentage, 100)}
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Spent: {formatCurrency(budget.spentAmount)}
                      </span>
                      <span>
                        Budget: {formatCurrency(budget.budgetAmount)}
                      </span>
                    </div>

                    {budget.isOverBudget && (
                      <p className="text-xs text-red-600 font-medium">
                        Over budget by {formatCurrency(budget.spentAmount - budget.budgetAmount)}
                      </p>
                    )}
                    
                    {!budget.isOverBudget && budget.remainingAmount > 0 && (
                      <p className="text-xs text-green-600">
                        {formatCurrency(budget.remainingAmount)} remaining
                      </p>
                    )}
                  </div>

                  {/* Status Indicators */}
                  {isNearLimit && !budget.isOverBudget && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Approaching limit</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {sortedBudgets.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Link href="/budgets">
              <Button variant="outline" className="w-full">
                Manage Budgets
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
