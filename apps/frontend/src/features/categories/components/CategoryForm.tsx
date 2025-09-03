'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createCategorySchema, updateCategorySchema } from '@/lib/validation/schemas';
import { createCategory, updateCategory } from '../actions';
import type { Category } from '@/lib/database/schemas';
import type { z } from 'zod';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!category;

  const form = useForm<CreateCategoryInput | UpdateCategoryInput>({
    resolver: zodResolver(isEditing ? updateCategorySchema : createCategorySchema),
    defaultValues: isEditing
      ? {
          id: category.id.toString(),
          name: category.name,
          description: category.description || '',
          type: category.type,
          isActive: category.isActive,
          monthlyBudgetLimit: category.monthlyBudgetLimit || 0,
        }
      : {
          name: '',
          description: '',
          type: 'expense',
          isActive: true,
          monthlyBudgetLimit: 0,
        },
  });

  const onSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        await updateCategory(data as UpdateCategoryInput);
      } else {
        await createCategory(data as CreateCategoryInput);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? 'Edit Category' : 'New Category'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              {...form.register('name')}
              placeholder="Category name"
              className="w-full"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              {...form.register('description')}
              placeholder="Optional description"
              className="w-full"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

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
              <option value="debt">Debt</option>
              <option value="investment">Investment</option>
              <option value="savings">Savings</option>
            </select>
            {form.formState.errors.type && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Budget Limit
            </label>
            <Input
              {...form.register('monthlyBudgetLimit')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full"
            />
            {form.formState.errors.monthlyBudgetLimit && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.monthlyBudgetLimit.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              {...form.register('isActive')}
              type="checkbox"
              id="isActive"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
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
