'use client';

import { SavingsProgress } from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, ExternalLink, Target, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SavingsGoalsWidgetProps {
  goals: SavingsProgress[];
  isLoading?: boolean;
}

export function SavingsGoalsWidget({ 
  goals, 
  isLoading 
}: SavingsGoalsWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Savings Goals
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-5 bg-muted rounded w-12" />
                </div>
                <div className="h-2 bg-muted rounded w-full" />
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort goals by completion percentage and priority
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1; // Show incomplete goals first
    }
    return b.percentage - a.percentage;
  }).slice(0, 4); // Show top 4 goals

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Savings Goals
          <Link href="/savings-goals">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank className="w-12 h-12 mx-auto mb-2" />
              <p>No savings goals</p>
              <p className="text-sm">Create goals to track your savings progress</p>
            </div>
          ) : (
            sortedGoals.map((goal) => {
              const isNearCompletion = goal.percentage >= 90;
              const daysToTarget = goal.targetDate 
                ? Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={goal.goalId} className="space-y-3">
                  {/* Goal Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{goal.goalName}</p>
                      {goal.targetDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {daysToTarget && daysToTarget > 0 
                              ? `${daysToTarget} days left`
                              : daysToTarget === 0
                                ? 'Due today'
                                : 'Overdue'
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {goal.isCompleted ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {goal.percentage.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(goal.percentage, 100)}
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Saved: {formatCurrency(goal.currentAmount)}
                      </span>
                      <span>
                        Target: {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    {!goal.isCompleted && goal.remainingAmount > 0 && (
                      <p className="text-xs text-blue-600">
                        {formatCurrency(goal.remainingAmount)} remaining
                      </p>
                    )}

                    {goal.monthlyTarget && !goal.isCompleted && (
                      <p className="text-xs text-muted-foreground">
                        Monthly target: {formatCurrency(goal.monthlyTarget)}
                      </p>
                    )}
                  </div>

                  {/* Status Indicators */}
                  {isNearCompletion && !goal.isCompleted && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Target className="w-3 h-3" />
                      <span>Almost there!</span>
                    </div>
                  )}

                  {goal.isCompleted && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Target className="w-3 h-3" />
                      <span>Goal achieved! 🎉</span>
                    </div>
                  )}

                  {daysToTarget !== null && daysToTarget < 0 && !goal.isCompleted && (
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      <Calendar className="w-3 h-3" />
                      <span>Target date passed</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {sortedGoals.length > 0 && (
          <div className="mt-6 pt-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/savings-goals">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Goals
                </Button>
              </Link>
              <Link href="/savings-goals?action=add">
                <Button size="sm" className="w-full">
                  Add Goal
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
