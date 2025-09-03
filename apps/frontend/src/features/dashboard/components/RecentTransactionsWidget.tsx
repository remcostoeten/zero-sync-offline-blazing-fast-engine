'use client';

import { RecentTransaction } from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RecentTransactionsWidgetProps {
  transactions: RecentTransaction[];
  isLoading?: boolean;
}

export function RecentTransactionsWidget({ 
  transactions, 
  isLoading 
}: RecentTransactionsWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Transactions
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-5 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Transactions
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent transactions</p>
              <p className="text-sm">Your transactions will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Transaction Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  transaction.type === 'income' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                )}>
                  {transaction.type === 'income' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {transaction.description || 'No description'}
                    </p>
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: transaction.categoryColor }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{transaction.categoryName}</span>
                    <span>•</span>
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Transaction Amount */}
                <div className="text-right">
                  <p className={cn(
                    'font-semibold',
                    transaction.type === 'income' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/transactions">
              <Button variant="outline" className="w-full">
                View All Transactions
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
