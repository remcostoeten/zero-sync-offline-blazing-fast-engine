'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavingsGoalWithProgress } from '../actions';
import { SavingsGoalCard } from './SavingsGoalCard';
import { SavingsGoalForm } from './SavingsGoalForm';
import { formatCurrency } from '@/lib/utils';

interface SavingsGoalListProps {
  goals: SavingsGoalWithProgress[];
  summary?: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    totalRemaining: number;
  };
  alerts?: {
    behindTarget: SavingsGoalWithProgress[];
    dueSoon: SavingsGoalWithProgress[];
    completed: SavingsGoalWithProgress[];
  };
  recommendations?: {
    totalRecommended: number;
    goalBreakdown: { goalName: string; recommended: number; priority: string }[];
  };
  onCreateGoal: (data: any) => void;
  onUpdateGoal: (data: any) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateProgress: (id: string, amount: number, type: 'deposit' | 'withdrawal') => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'targetAmount' | 'currentAmount' | 'progress' | 'targetDate' | 'priority' | 'created';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'completed' | 'inactive';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

export function SavingsGoalList({
  goals,
  summary,
  alerts,
  recommendations,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateProgress,
  isLoading = false,
}: SavingsGoalListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalWithProgress | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Filter and sort goals
  const filteredAndSortedGoals = goals
    .filter((goal) => {
      // Search filter
      const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           goal.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'active' && goal.isActive && !goal.isCompleted) ||
        (filterStatus === 'completed' && goal.isCompleted) ||
        (filterStatus === 'inactive' && !goal.isActive);
      
      // Priority filter
      const matchesPriority = filterPriority === 'all' || goal.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'targetAmount':
          aValue = a.targetAmount;
          bValue = b.targetAmount;
          break;
        case 'currentAmount':
          aValue = a.currentAmount;
          bValue = b.currentAmount;
          break;
        case 'progress':
          aValue = a.progress.percentage;
          bValue = b.progress.percentage;
          break;
        case 'targetDate':
          aValue = a.targetDate ? new Date(a.targetDate).getTime() : 0;
          bValue = b.targetDate ? new Date(b.targetDate).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleEditGoal = (goal: SavingsGoalWithProgress) => {
    setSelectedGoal(goal);
    setShowEditForm(true);
  };

  const handleCreateSubmit = (data: any) => {
    onCreateGoal(data);
    setShowCreateForm(false);
  };

  const handleUpdateSubmit = (data: any) => {
    onUpdateGoal(data);
    setShowEditForm(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      onDeleteGoal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Goals</p>
                  <p className="text-2xl font-bold">{summary.totalGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold">{summary.activeGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalCurrentAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{summary.completedGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {alerts && (alerts.behindTarget.length > 0 || alerts.dueSoon.length > 0 || alerts.completed.length > 0) && (
        <div className="space-y-4">
          {alerts.behindTarget.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Goals Behind Target ({alerts.behindTarget.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.behindTarget.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant="destructive">
                        {goal.progress.percentage.toFixed(0)}% complete
                      </Badge>
                    </div>
                  ))}
                  {alerts.behindTarget.length > 3 && (
                    <p className="text-sm text-red-600">
                      And {alerts.behindTarget.length - 3} more goals need attention
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {alerts.dueSoon.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Goals Due Soon ({alerts.dueSoon.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.dueSoon.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant="outline" className="text-yellow-700">
                        {goal.progress.daysLeft} days left
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.goalBreakdown.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Savings Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-lg font-semibold">
                Total Recommended: {formatCurrency(recommendations.totalRecommended)}/month
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recommendations.goalBreakdown.slice(0, 4).map((item) => (
                  <div key={item.goalName} className="flex justify-between items-center">
                    <span className="text-sm">{item.goalName}</span>
                    <span className="font-medium">{formatCurrency(item.recommended)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          {/* Search */}
          <div className="relative min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as FilterPriority)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort('name')}>Name</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('progress')}>Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('targetAmount')}>Target Amount</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('targetDate')}>Target Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('priority')}>Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('created')}>Created Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Create Button */}
        <Button onClick={() => setShowCreateForm(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedGoals.length} of {goals.length} savings goals
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedGoals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No savings goals found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? "No goals match your current filters"
                : "Get started by creating your first savings goal"
              }
            </p>
            {(!searchTerm && filterStatus === 'all' && filterPriority === 'all') && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onAddProgress={onUpdateProgress}
            />
          ))}
        </div>
      )}

      {/* Forms */}
      <SavingsGoalForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateSubmit}
      />
      
      <SavingsGoalForm
        goal={selectedGoal || undefined}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSubmit={handleUpdateSubmit}
      />
    </div>
  );
}
