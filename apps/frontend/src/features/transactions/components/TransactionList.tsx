'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TransactionCard } from './TransactionCard';
import { TransactionForm } from './TransactionForm';
import { deleteTransaction, getTransactions, getTransactionSummary } from '../actions';
import { getCategories } from '@/features/categories/actions';
import { Plus, Search, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { Transaction, Category } from '@/lib/database/schemas';

interface TransactionListProps {
  initialTransactions: (Transaction & { category: { name: string; type: string; color?: string } })[];
}

export function TransactionList({ initialTransactions }: TransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<{
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
    netAmount: number;
  } | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<typeof initialTransactions[0] | undefined>();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Load categories and summary on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedCategories, summaryData] = await Promise.all([
          getCategories(),
          getTransactionSummary()
        ]);
        setCategories(fetchedCategories);
        setSummary(summaryData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // Apply filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = searchTerm === '' || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || transaction.categoryId === categoryFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    const matchesDateRange = 
      (!dateRange.start || transaction.date >= dateRange.start) &&
      (!dateRange.end || transaction.date <= dateRange.end);

    return matchesSearch && matchesCategory && matchesType && matchesDateRange;
  });

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingTransaction(undefined);
    
    // Refresh transactions and summary
    try {
      const [updatedTransactions, updatedSummary] = await Promise.all([
        getTransactions(),
        getTransactionSummary()
      ]);
      setTransactions(updatedTransactions);
      setSummary(updatedSummary);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleEdit = (transaction: typeof initialTransactions[0]) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (transactionId: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction({ id: transactionId.toString() });
        setTransactions(transactions.filter(t => t.id !== transactionId));
        
        // Refresh summary
        const updatedSummary = await getTransactionSummary();
        setSummary(updatedSummary);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(undefined);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Transaction</span>
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">Total Income</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <CardTitle className="text-sm">Total Expenses</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">
                ${summary.totalExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Net Amount</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-2xl font-bold ${
                summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${summary.netAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <CardTitle className="text-sm">Total Transactions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {summary.transactionCount}
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
            {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || dateRange.start || dateRange.end) && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
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
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <Input
              type="date"
              placeholder="Start date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="End date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">
            {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
          </div>
          {transactions.length === 0 && (
            <Button onClick={() => setShowForm(true)} variant="outline">
              Create your first transaction
            </Button>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-card-foreground">
                  {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <TransactionForm
                transaction={editingTransaction}
                onSuccess={handleFormSuccess}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
