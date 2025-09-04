'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar,
  Plus,
  Pause,
  Play,
  Edit,
  Trash2,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type TRecurringTransaction = {
  id: number;
  name: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  autoGenerate: boolean;
  nextDueDate: string;
  lastGenerated?: string;
  categoryName: string;
  categoryColor: string;
  createdAt: string;
};

type TUpcomingTransaction = {
  id: number;
  recurringId: number;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  dueDate: string;
  status: 'pending' | 'generated' | 'skipped';
  categoryName: string;
  categoryColor: string;
};

type TProps = {
  recurringTransactions: TRecurringTransaction[];
  upcomingTransactions: TUpcomingTransaction[];
  onToggleActive: (id: number, active: boolean) => void;
  onToggleAutoGenerate: (id: number, autoGenerate: boolean) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
  onSkip: (upcomingId: number) => void;
  onGenerate: (upcomingId: number) => void;
};

function RecurringTransactionCard({ 
  transaction, 
  onToggleActive, 
  onToggleAutoGenerate,
  onEdit,
  onDelete 
}: {
  transaction: TRecurringTransaction;
  onToggleActive: (id: number, active: boolean) => void;
  onToggleAutoGenerate: (id: number, autoGenerate: boolean) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const isIncome = transaction.type === 'income';
  const isOverdue = new Date(transaction.nextDueDate) < new Date();

  return (
    <Card className={cn(
      'transition-all',
      !transaction.isActive && 'opacity-60',
      isOverdue && transaction.isActive && 'border-orange-200'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: transaction.categoryColor }}
            />
            <div>
              <h4 className="font-medium">{transaction.name}</h4>
              <p className="text-xs text-muted-foreground">{transaction.categoryName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOverdue && transaction.isActive && (
              <AlertCircle className="w-4 h-4 text-orange-500" />
            )}
            <p className={cn(
              'font-semibold',
              isIncome ? 'text-green-600' : 'text-red-600'
            )}>
              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="capitalize">{transaction.frequency}</span>
            </div>
            <div>
              Next: {formatDate(transaction.nextDueDate)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={transaction.isActive ? 'default' : 'secondary'}>
              {transaction.isActive ? 'Active' : 'Paused'}
            </Badge>
            {transaction.autoGenerate && (
              <Badge variant="outline">Auto</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={transaction.isActive}
                onCheckedChange={(checked) => onToggleActive(transaction.id, checked)}
              />
              <span className="text-xs">Active</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={transaction.autoGenerate}
                onCheckedChange={(checked) => onToggleAutoGenerate(transaction.id, checked)}
                disabled={!transaction.isActive}
              />
              <span className="text-xs">Auto-generate</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(transaction.id)}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(transaction.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingTransactionCard({ 
  transaction, 
  onSkip, 
  onGenerate 
}: {
  transaction: TUpcomingTransaction;
  onSkip: (id: number) => void;
  onGenerate: (id: number) => void;
}) {
  const isIncome = transaction.type === 'income';
  const isOverdue = new Date(transaction.dueDate) < new Date();
  const isPending = transaction.status === 'pending';

  return (
    <Card className={cn(
      'transition-all',
      isOverdue && 'border-orange-200 bg-orange-50/50',
      transaction.status === 'generated' && 'border-green-200 bg-green-50/50',
      transaction.status === 'skipped' && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: transaction.categoryColor }}
            />
            <div>
              <h4 className="font-medium">{transaction.name}</h4>
              <p className="text-xs text-muted-foreground">{transaction.categoryName}</p>
            </div>
          </div>
          
          <p className={cn(
            'font-semibold',
            isIncome ? 'text-green-600' : 'text-red-600'
          )}>
            {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Due: {formatDate(transaction.dueDate)}</span>
            {isOverdue && <span className="text-orange-600 font-medium">(Overdue)</span>}
          </div>

          <Badge variant={
            transaction.status === 'pending' ? 'default' :
            transaction.status === 'generated' ? 'default' :
            'secondary'
          }>
            {transaction.status === 'pending' && isOverdue ? 'Overdue' : transaction.status}
          </Badge>
        </div>

        {isPending && (
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onGenerate(transaction.id)}
              className="flex-1"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Generate
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSkip(transaction.id)}
            >
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecurringStats({ 
  transactions, 
  upcomingTransactions 
}: {
  transactions: TRecurringTransaction[];
  upcomingTransactions: TUpcomingTransaction[];
}) {
  const activeCount = transactions.filter(t => t.isActive).length;
  const totalCount = transactions.length;
  const overdueCount = upcomingTransactions.filter(t => 
    t.status === 'pending' && new Date(t.dueDate) < new Date()
  ).length;
  
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.isActive)
    .reduce((sum, t) => sum + (t.frequency === 'monthly' ? t.amount : 0), 0);
    
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.isActive)
    .reduce((sum, t) => sum + (t.frequency === 'monthly' ? t.amount : 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{totalCount}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(monthlyIncome)}
          </p>
          <p className="text-xs text-muted-foreground">Monthly Income</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(monthlyExpenses)}
          </p>
          <p className="text-xs text-muted-foreground">Monthly Expenses</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function RecurringTab({
  recurringTransactions,
  upcomingTransactions,
  onToggleActive,
  onToggleAutoGenerate,
  onEdit,
  onDelete,
  onCreate,
  onSkip,
  onGenerate
}: TProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const filteredTransactions = recurringTransactions.filter(transaction => {
    if (filter === 'active') return transaction.isActive;
    if (filter === 'paused') return !transaction.isActive;
    return true;
  });

  const pendingTransactions = upcomingTransactions.filter(t => t.status === 'pending');
  const overdueTransactions = pendingTransactions.filter(t => new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <RecurringStats 
        transactions={recurringTransactions}
        upcomingTransactions={upcomingTransactions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Transactions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upcoming Transactions</span>
                {overdueTransactions.length > 0 && (
                  <Badge variant="destructive">{overdueTransactions.length} overdue</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming transactions
                </p>
              ) : (
                pendingTransactions.map((transaction) => (
                  <UpcomingTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onSkip={onSkip}
                    onGenerate={onGenerate}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recurring Transactions Management */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Recurring Transactions</h3>
              <p className="text-sm text-muted-foreground">
                Manage your recurring income and expenses
              </p>
            </div>
            
            <Button onClick={onCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Recurring
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter:</span>
            {(['all', 'active', 'paused'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="capitalize"
              >
                {filterOption}
              </Button>
            ))}
          </div>

          {/* Recurring Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">No recurring transactions</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up recurring transactions to automate your finances
                  </p>
                  <Button onClick={onCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <RecurringTransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onToggleActive={onToggleActive}
                  onToggleAutoGenerate={onToggleAutoGenerate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
