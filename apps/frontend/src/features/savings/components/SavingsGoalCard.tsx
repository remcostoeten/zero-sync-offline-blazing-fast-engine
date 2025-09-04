'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavingsGoalWithProgress } from '../actions';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';

interface SavingsGoalCardProps {
  goal: SavingsGoalWithProgress;
  onEdit?: (goal: SavingsGoalWithProgress) => void;
  onDelete?: (id: string) => void;
  onAddProgress?: (id: string, amount: number, type: 'deposit' | 'withdrawal') => void;
  className?: string;
}

export function SavingsGoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onAddProgress,
  className 
}: SavingsGoalCardProps) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [progressAmount, setProgressAmount] = useState('');
  const [progressType, setProgressType] = useState<'deposit' | 'withdrawal'>('deposit');

  const handleAddProgress = () => {
    const amount = parseFloat(progressAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    onAddProgress?.(goal.id.toString(), amount, progressType);
    setProgressAmount('');
    setIsAddingProgress(false);
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

  const getStatusColor = () => {
    if (goal.isCompleted) return 'text-green-600';
    if (!goal.progress.isOnTrack && goal.progress.daysLeft && goal.progress.daysLeft > 0) {
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  const getProgressBarColor = () => {
    if (goal.isCompleted) return 'bg-green-500';
    if (goal.progress.percentage >= 75) return 'bg-green-500';
    if (goal.progress.percentage >= 50) return 'bg-yellow-500';
    if (goal.progress.percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn(
      'relative transition-all duration-200 hover:shadow-md',
      !goal.isActive && 'opacity-60',
      goal.isCompleted && 'border-green-200 bg-green-50/30',
      className
    )}>
      {/* Priority indicator */}
      <div 
        className={cn(
          'absolute top-0 left-0 w-1 h-full rounded-l-lg',
          getPriorityColor(goal.priority)
        )}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: goal.color + '20', color: goal.color }}
            >
              {goal.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{goal.name}</h3>
              {goal.description && (
                <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={getPriorityVariant(goal.priority)}>
              {goal.priority}
            </Badge>
            
            {goal.isCompleted ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : !goal.progress.isOnTrack && goal.progress.daysLeft && goal.progress.daysLeft > 0 ? (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Behind
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className={cn('font-medium', getStatusColor())}>
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </span>
            <span className="font-bold">{goal.progress.percentage.toFixed(1)}%</span>
          </div>
          
          <Progress 
            value={goal.progress.percentage} 
            className="h-2"
            style={{
              '--progress-background': getProgressBarColor()
            } as React.CSSProperties}
          />
          
          <div className="text-xs text-gray-500">
            {formatCurrency(goal.progress.remaining)} remaining
          </div>
        </div>

        {/* Goal Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {goal.targetDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-600">Target Date</div>
                <div className="font-medium">{formatDate(goal.targetDate)}</div>
                {goal.progress.daysLeft && (
                  <div className="text-xs text-gray-500">
                    {goal.progress.daysLeft} days left
                  </div>
                )}
              </div>
            </div>
          )}

          {goal.monthlyTarget && (
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-600">Monthly Target</div>
                <div className="font-medium">{formatCurrency(goal.monthlyTarget)}</div>
              </div>
            </div>
          )}

          {goal.progress.recommendedMonthly && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-600">Recommended Monthly</div>
                <div className="font-medium">{formatCurrency(goal.progress.recommendedMonthly)}</div>
              </div>
            </div>
          )}

          {goal.category && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <div>
                <div className="text-gray-600">Category</div>
                <div className="font-medium">{goal.category}</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Progress Update */}
        {!goal.isCompleted && goal.isActive && (
          <div className="border-t pt-3">
            {!isAddingProgress ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingProgress(true)}
                className="w-full"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Update Progress
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant={progressType === 'deposit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressType('deposit')}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant={progressType === 'withdrawal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressType('withdrawal')}
                  >
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={progressAmount}
                    onChange={(e) => setProgressAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                    step="0.01"
                  />
                  <Button size="sm" onClick={handleAddProgress}>
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsAddingProgress(false);
                      setProgressAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-gray-500">
            Created {formatDate(goal.createdAt)}
          </div>
          
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(goal.id.toString())}
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
