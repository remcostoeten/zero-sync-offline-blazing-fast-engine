'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpDown,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type TTransaction = {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  categoryName: string;
  categoryColor: string;
  createdAt: string;
};

type THistoryFilter = {
  search: string;
  dateRange: {
    from: string;
    to: string;
  };
  type: 'all' | 'income' | 'expense';
  category: string;
  amountRange: {
    min: number;
    max: number;
  };
};

type TProps = {
  transactions: TTransaction[];
  categories: any[];
  totalCount: number;
  currentPage: number;
  onFilterChange: (filters: Partial<THistoryFilter>) => void;
  onPageChange: (page: number) => void;
  onExport: (format: 'csv' | 'pdf') => void;
};

function TransactionRow({ transaction, onView }: { 
  transaction: TTransaction;
  onView: (id: number) => void;
}) {
  const isIncome = transaction.type === 'income';
  
  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: transaction.categoryColor }}
          />
          <div>
            <p className="font-medium text-sm">{transaction.description}</p>
            <p className="text-xs text-muted-foreground">{transaction.categoryName}</p>
          </div>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <Badge variant={isIncome ? 'default' : 'secondary'} className="text-xs">
          {transaction.type}
        </Badge>
      </td>
      
      <td className="py-3 px-4">
        <p className={cn(
          'font-medium',
          isIncome ? 'text-green-600' : 'text-red-600'
        )}>
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
        </p>
      </td>
      
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {formatDate(transaction.date)}
      </td>
      
      <td className="py-3 px-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onView(transaction.id)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

function FilterPanel({ 
  filters, 
  categories, 
  onFilterChange 
}: {
  filters: THistoryFilter;
  categories: any[];
  onFilterChange: (filters: Partial<THistoryFilter>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium">Search</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">From</label>
            <Input
              type="date"
              value={filters.dateRange.from}
              onChange={(e) => onFilterChange({ 
                dateRange: { ...filters.dateRange, from: e.target.value }
              })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <Input
              type="date"
              value={filters.dateRange.to}
              onChange={(e) => onFilterChange({ 
                dateRange: { ...filters.dateRange, to: e.target.value }
              })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-sm font-medium">Type</label>
          <div className="flex gap-2 mt-1">
            {['all', 'income', 'expense'].map((type) => (
              <Button
                key={type}
                variant={filters.type === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({ type: type as any })}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onFilterChange({
            search: '',
            type: 'all',
            category: '',
            dateRange: { from: '', to: '' }
          })}
          className="w-full"
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}

function TransactionSummary({ transactions }: { transactions: TTransaction[] }) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netAmount = totalIncome - totalExpenses;
  const transactionCount = transactions.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-muted-foreground">Total Income</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-muted-foreground">Total Expenses</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netAmount)}
          </p>
          <div className="flex items-center justify-center gap-1">
            {netAmount >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <p className="text-xs text-muted-foreground">Net Amount</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {transactionCount}
          </p>
          <p className="text-xs text-muted-foreground">Total Transactions</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function HistoryTab({
  transactions,
  categories,
  totalCount,
  currentPage,
  onFilterChange,
  onPageChange,
  onExport
}: TProps) {
  const [filters, setFilters] = useState<THistoryFilter>({
    search: '',
    dateRange: { from: '', to: '' },
    type: 'all',
    category: '',
    amountRange: { min: 0, max: 0 }
  });

  function handleFilterChange(newFilters: Partial<THistoryFilter>) {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }

  function handleViewTransaction(id: number) {
    // TODO: Open transaction detail modal or navigate to detail page
    console.log('View transaction:', id);
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <TransactionSummary transactions={transactions} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel 
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Transaction Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Table Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Transaction History</h3>
              <p className="text-sm text-muted-foreground">
                Showing {transactions.length} of {totalCount} transactions
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        Description
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        Amount
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        Date
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onView={handleViewTransaction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            
            {transactions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No transactions found matching your criteria.
              </div>
            )}
          </Card>

          {/* Pagination */}
          {totalCount > 10 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalCount / 10)}
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / 10)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
