import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Calendar, User } from 'lucide-react';
import type { Transaction } from '@/lib/database/schemas';

interface TransactionCardProps {
  transaction: Transaction & { 
    category: { 
      name: string; 
      type: string; 
      color?: string;
    } 
  };
  onEdit?: (transaction: TransactionCardProps['transaction']) => void;
  onDelete?: (transactionId: number) => void;
}

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const amountPrefix = isIncome ? '+' : '-';
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ 
              backgroundColor: transaction.category.color + '20',
              color: transaction.category.color 
            }}>
              {isIncome ? (
                <ArrowUpCircle className="h-4 w-4" />
              ) : (
                <ArrowDownCircle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">
                  {transaction.description || 'Transaction'}
                </h3>
                <Badge 
                  variant={isIncome ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {transaction.category.name}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
                {transaction.payee && (
                  <>
                    <User className="h-3 w-3" />
                    <span>{transaction.payee}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`text-right`}>
              <div className={`font-bold text-lg ${amountColor}`}>
                {amountPrefix}${Math.abs(transaction.amount).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {transaction.type}
              </div>
            </div>
            
            <div className="flex space-x-1 ml-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(transaction)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(transaction.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      {(transaction.reference || (transaction.tags && transaction.tags.length > 0)) && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {transaction.reference && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Ref:</span> {transaction.reference}
              </div>
            )}
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {transaction.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
