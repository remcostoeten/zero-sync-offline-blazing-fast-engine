'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BudgetCard } from './BudgetCard';
import { BudgetForm } from './BudgetForm';
import { deleteBudget, getBudgets, getBudgetSummary, getBudgetAlerts, type BudgetWithSpending } from '../actions';
import { getCategories } from '@/features/categories/actions';
import { Plus, Search, Filter, Target, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import type { Category } from '@/lib/database/schemas';

interface BudgetListProps {
  initialBudgets: BudgetWithSpending[];
}

export function BudgetList({ initialBudgets }: BudgetListProps) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<{
    totalBudgets: number;
    activeBudgets: number;
    totalBudgetAmount: number;
  } | null>(null);
  const [alerts, setAlerts] = useState<{
    overBudget: BudgetWithSpending[];
    nearLimit: BudgetWithSpending[];
  } | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | undefined>();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'quarterly' | 'yearly'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'over' | 'near'>('all');

  // Load categories, summary, and alerts on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedCategories, summaryData, alertsData] = await Promise.all([
          getCategories(),
          getBudgetSummary(),
          getBudgetAlerts()
        ]);
        setCategories(fetchedCategories);
        setSummary(summaryData);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // Apply filters
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = searchTerm === '' || 
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || budget.categoryId === categoryFilter;
    const matchesPeriod = periodFilter === 'all' || budget.period === periodFilter;
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && budget.isActive) ||
      (statusFilter === 'inactive' && !budget.isActive) ||
      (statusFilter === 'over' && budget.spending.isOverBudget) ||
      (statusFilter === 'near' && budget.spending.isNearLimit);

    return matchesSearch && matchesCategory && matchesPeriod && matchesStatus;
  });

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingBudget(undefined);
    
    // Refresh budgets, summary, and alerts
    try {
      const [updatedBudgets, updatedSummary, updatedAlerts] = await Promise.all([
        getBudgets(),
        getBudgetSummary(),
        getBudgetAlerts()
      ]);
      setBudgets(updatedBudgets);
      setSummary(updatedSummary);
      setAlerts(updatedAlerts);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleEdit = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = async (budgetId: number) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget({ id: budgetId.toString() });
        setBudgets(budgets.filter(b => b.id !== budgetId));
        
        // Refresh summary and alerts
        const [updatedSummary, updatedAlerts] = await Promise.all([
          getBudgetSummary(),
          getBudgetAlerts()
        ]);
        setSummary(updatedSummary);
        setAlerts(updatedAlerts);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(undefined);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPeriodFilter('all');
    setStatusFilter('all');
  };

  // Calculate totals for filtered budgets
  const totalBudgeted = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spending.total, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Monitor and control your spending</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Budget</span>
        </Button>
      </div>

      {/* Alert Cards */}
      {alerts && (alerts.overBudget.length > 0 || alerts.nearLimit.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alerts.overBudget.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm text-red-800">Over Budget</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-red-900 font-medium">{alerts.overBudget.length} budgets</div>
                <div className="text-xs text-red-700 mt-1">
                  {alerts.overBudget.map(b => b.name).join(', ')}
                </div>
              </CardContent>
            </Card>
          )}

          {alerts.nearLimit.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <CardTitle className="text-sm text-yellow-800">Near Limit</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-yellow-900 font-medium">{alerts.nearLimit.length} budgets</div>
                <div className="text-xs text-yellow-700 mt-1">
                  {alerts.nearLimit.map(b => b.name).join(', ')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Total Budgets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{summary.activeBudgets}</div>
              <div className="text-xs text-gray-500">
                {summary.totalBudgets} total • {summary.activeBudgets} active
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">Total Budgeted</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                ${totalBudgeted.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <CardTitle className="text-sm">Total Spent</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-600">
                ${totalSpent.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm">Remaining</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-2xl font-bold ${
                totalRemaining >= 0 ? 'text-purple-600' : 'text-red-600'
              }`}>
                ${totalRemaining.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {(searchTerm || categoryFilter !== 'all' || periodFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-xs"
              >
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c.type === 'expense' || c.type === 'debt').map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Periods</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="over">Over Budget</option>
              <option value="near">Near Limit</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      {filteredBudgets.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Showing {filteredBudgets.length} of {budgets.length} budgets
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">
            {budgets.length === 0 ? 'No budgets yet' : 'No budgets match your filters'}
          </div>
          {budgets.length === 0 && (
            <Button onClick={() => setShowForm(true)} variant="outline">
              Create your first budget
            </Button>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BudgetForm
              budget={editingBudget}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
