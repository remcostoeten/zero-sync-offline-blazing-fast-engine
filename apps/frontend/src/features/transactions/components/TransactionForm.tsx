'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/validation/schemas';
import { createTransaction, updateTransaction } from '../actions';
import { getCategories } from '@/features/categories/actions';
import type { Transaction, Category } from '@/lib/database/schemas';
import type { z } from 'zod';

type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

interface TransactionFormProps {
  transaction?: Transaction & { category: { name: string; type: string; color?: string } };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = !!transaction;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<CreateTransactionInput | UpdateTransactionInput>({
    resolver: zodResolver(isEditing ? updateTransactionSchema : createTransactionSchema),
    defaultValues: isEditing
      ? {
          id: transaction.id.toString(),
          amount: transaction.amount,
          type: transaction.type,
          categoryId: transaction.categoryId,
          date: transaction.date,
          description: transaction.description || '',
          payee: transaction.payee || '',
          reference: transaction.reference || '',
        }
      : {
          amount: 0,
          type: 'expense',
          categoryId: 0,
          date: today,
          description: '',
          payee: '',
          reference: '',
        },
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
        
        // Set default category if not editing
        if (!isEditing && fetchedCategories.length > 0) {
          const expenseCategories = fetchedCategories.filter(cat => 
            cat.type === 'expense' && cat.isActive
          );
          if (expenseCategories.length > 0) {
            form.setValue('categoryId', expenseCategories[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadCategories();
  }, [form, isEditing]);

  const watchedType = form.watch('type');
  const watchedCategoryId = form.watch('categoryId');

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => {
    if (watchedType === 'income') {
      return category.type === 'income' || category.type === 'investment' || category.type === 'savings';
    } else {
      return category.type === 'expense' || category.type === 'debt';
    }
  });

  // Auto-select first matching category when type changes
  useEffect(() => {
    if (filteredCategories.length > 0 && !isEditing) {
      const currentCategoryValid = filteredCategories.some(cat => cat.id === watchedCategoryId);
      if (!currentCategoryValid) {
        form.setValue('categoryId', filteredCategories[0].id);
      }
    }
  }, [watchedType, filteredCategories, form, isEditing, watchedCategoryId]);

  const onSubmit = async (data: CreateTransactionInput | UpdateTransactionInput) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        await updateTransaction(data as UpdateTransactionInput);
      } else {
        await createTransaction(data as CreateTransactionInput);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              {form.formState.errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <Input
                {...form.register('amount')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full"
              />
              {form.formState.errors.amount && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              {...form.register('categoryId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </select>
            {form.formState.errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.categoryId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <Input
              {...form.register('date')}
              type="date"
              className="w-full"
            />
            {form.formState.errors.date && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              {...form.register('description')}
              placeholder="Transaction description"
              className="w-full"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payee/Recipient
              </label>
              <Input
                {...form.register('payee')}
                placeholder="Who paid/received"
                className="w-full"
              />
              {form.formState.errors.payee && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.payee.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference
              </label>
              <Input
                {...form.register('reference')}
                placeholder="Reference number"
                className="w-full"
              />
              {form.formState.errors.reference && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.reference.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
