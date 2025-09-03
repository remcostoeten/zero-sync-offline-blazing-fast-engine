'use client';

import { useState, useEffect } from 'react';
import { RecurringTransactionWithAnalytics } from '../actions';
import { RecurringTransactionCard } from './RecurringTransactionCard';
import { RecurringTransactionForm } from './RecurringTransactionForm';
import { TRecurringTransaction } from '@/lib/database/schemas';
import { 
  getRecurringTransactionsWithAnalytics,
  deleteRecurringTransaction,
  toggleRecurringTransactionStatus,
  generateRecurringTransactions
} from '../actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  Filter, 
  SortAsc, 
  SortDesc,
  RefreshCw,
  AlertTriangle,
  Play,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface RecurringTransactionListProps {
  initialData?: RecurringTransactionWithAnalytics[];
}

export function RecurringTransactionList({ 
  initialData = [] 
}: RecurringTransactionListProps) {
  const [transactions, setTransactions] = useState<RecurringTransactionWithAnalytics[]>(initialData);
  const [filteredTransactions, setFilteredTransactions] = useState<RecurringTransactionWithAnalytics[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'frequency' | 'nextDue'>('nextDue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TRecurringTransaction | undefined>();
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load data
  useEffect(() => {
    if (initialData.length === 0) {
      loadTransactions();
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === selectedType);
    }

    // Frequency filter
    if (selectedFrequency !== 'all') {
      filtered = filtered.filter(transaction => transaction.frequency === selectedFrequency);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(transaction => transaction.isActive === isActive);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof RecurringTransactionWithAnalytics];
      let bValue: any = b[sortBy as keyof RecurringTransactionWithAnalytics];

      if (sortBy === 'nextDue') {
        aValue = a.analytics.nextDueDate || '9999-12-31';
        bValue = b.analytics.nextDueDate || '9999-12-31';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, selectedType, selectedFrequency, selectedStatus, sortBy, sortOrder]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getRecurringTransactionsWithAnalytics({ 
        includePastDue: true 
      });
      setTransactions(data);
    } catch (error) {
      toast.error('Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (id: number) => {
    // Implement view details functionality
    console.log('View transaction:', id);
  };

  const handleEdit = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsFormOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    setDeletingTransactionId(id);
  };

  const confirmDelete = async () => {
    if (!deletingTransactionId) return;

    try {
      await deleteRecurringTransaction({ id: deletingTransactionId.toString() });
      toast.success('Recurring transaction deleted successfully');
      await loadTransactions();
    } catch (error) {
      toast.error('Failed to delete recurring transaction');
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await toggleRecurringTransactionStatus({ id: id.toString(), isActive });
      toast.success(`Recurring transaction ${isActive ? 'activated' : 'deactivated'} successfully`);
      await loadTransactions();
    } catch (error) {
      toast.error('Failed to update recurring transaction status');
    }
  };

  const handleGenerateTransactions = async () => {
    setIsGenerating(true);
    try {
      const result = await generateRecurringTransactions();
      
      if (result.generated > 0) {
        toast.success(`Successfully generated ${result.generated} transactions`);
        await loadTransactions(); // Refresh the list
      } else {
        toast.info('No transactions were due for generation');
      }

      if (result.errors.length > 0) {
        result.errors.forEach(error => toast.error(error));
      }
    } catch (error) {
      toast.error('Failed to generate transactions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSuccess = () => {
    loadTransactions();
    setEditingTransaction(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(undefined);
  };

  // Calculate summary stats
  const stats = {
    total: transactions.length,
    active: transactions.filter(t => t.isActive).length,
    overdue: transactions.filter(t => t.analytics.isOverdue).length,
    dueSoon: transactions.filter(t => 
      t.analytics.daysUntilNext !== undefined && 
      t.analytics.daysUntilNext >= 0 && 
      t.analytics.daysUntilNext <= 7
    ).length,
    totalMonthlyEstimate: transactions
      .filter(t => t.isActive)
      .reduce((sum, t) => sum + t.analytics.estimatedMonthlyTotal, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Transactions</h2>
          <p className="text-muted-foreground">
            Manage your recurring income and expenses
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateTransactions}
            disabled={isGenerating}
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Due'}
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring Transaction
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold text-lg">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="font-semibold text-lg">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="font-semibold text-lg text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="font-semibold text-lg text-yellow-600">{stats.dueSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Est.</p>
                <p className="font-semibold text-lg">{formatCurrency(stats.totalMonthlyEstimate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description, payee, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nextDue">Next Due</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="frequency">Frequency</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={loadTransactions}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTransactions.length} of {transactions.length} recurring transactions
        </p>
        {(searchTerm || selectedType !== 'all' || selectedFrequency !== 'all' || selectedStatus !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              setSelectedFrequency('all');
              setSelectedStatus('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Transaction Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTransactions.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No recurring transactions found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || selectedType !== 'all' || selectedFrequency !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by creating your first recurring transaction.'
                  }
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recurring Transaction
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <RecurringTransactionCard
              key={transaction.id}
              transaction={transaction}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>

      {/* Form Dialog */}
      <RecurringTransactionForm
        transaction={editingTransaction}
        isOpen={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deletingTransactionId} 
        onOpenChange={() => setDeletingTransactionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring transaction? This action cannot be undone.
              Future transactions will no longer be generated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
