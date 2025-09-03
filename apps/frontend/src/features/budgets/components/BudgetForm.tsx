'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Palette, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, addYears } from 'date-fns';
import { createBudgetSchema, updateBudgetSchema } from '@/lib/validation/schemas';
import { BudgetWithProgress, getBudgetCategories } from '../actions';
import { TCategory } from '@/lib/database/schemas';

type CreateFormData = z.infer<typeof createBudgetSchema>;
type UpdateFormData = z.infer<typeof updateBudgetSchema>;

interface BudgetFormProps {
  budget?: BudgetWithProgress;
  onSubmit: (data: CreateFormData | UpdateFormData) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const BUDGET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Budget resets every week' },
  { value: 'monthly', label: 'Monthly', description: 'Budget resets every month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Budget resets every 3 months' },
  { value: 'yearly', label: 'Yearly', description: 'Budget resets every year' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', color: 'text-green-600', description: 'Flexible spending category' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600', description: 'Regular monitoring needed' },
  { value: 'high', label: 'High Priority', color: 'text-red-600', description: 'Strict budget enforcement' },
];

export function BudgetForm({ 
  budget, 
  onSubmit, 
  trigger, 
  open, 
  onOpenChange 
}: BudgetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(budget?.color || '#3B82F6');
  const [categories, setCategories] = useState<TCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const isEditing = !!budget;
  const schema = isEditing ? updateBudgetSchema : createBudgetSchema;

  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? {
      id: budget.id.toString(),
      name: budget.name,
      description: budget.description || '',
      categoryId: budget.categoryId,
      amount: budget.amount,
      spent: budget.spent || 0,
      period: budget.period as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
      startDate: budget.startDate,
      endDate: budget.endDate || undefined,
      isActive: budget.isActive,
      alertThreshold: budget.alertThreshold || 0.8,
      rollover: budget.rollover,
      carryoverAmount: budget.carryoverAmount || 0,
      color: budget.color || '#3B82F6',
      priority: budget.priority as 'low' | 'medium' | 'high',
      autoRenew: budget.autoRenew,
      resetDay: budget.resetDay || 1,
    } : {
      name: '',
      description: '',
      categoryId: 0,
      amount: 0,
      spent: 0,
      period: 'monthly' as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
      isActive: true,
      alertThreshold: 0.8,
      rollover: false,
      carryoverAmount: 0,
      color: selectedColor,
      priority: 'medium' as const,
      autoRenew: true,
      resetDay: 1,
    }
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = await getBudgetCategories();
        setCategories(categoryData);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = (data: CreateFormData | UpdateFormData) => {
    const formData = {
      ...data,
      color: selectedColor,
    };
    onSubmit(formData);
    form.reset();
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
    if (!open) {
      form.reset();
    }
  };

  const currentOpen = open !== undefined ? open : isOpen;

  // Helper to calculate suggested end date based on period
  const calculateEndDate = (startDate: string, period: string) => {
    const start = new Date(startDate);
    switch (period) {
      case 'weekly':
        return addDays(start, 6);
      case 'monthly':
        return addDays(addMonths(start, 1), -1);
      case 'quarterly':
        return addDays(addMonths(start, 3), -1);
      case 'yearly':
        return addDays(addYears(start, 1), -1);
      default:
        return addDays(addMonths(start, 1), -1);
    }
  };

  // Watch for period and start date changes to suggest end date
  const watchedStartDate = form.watch('startDate');
  const watchedPeriod = form.watch('period');

  useEffect(() => {
    if (watchedStartDate && watchedPeriod && !isEditing) {
      const suggestedEndDate = calculateEndDate(watchedStartDate, watchedPeriod);
      form.setValue('endDate', suggestedEndDate.toISOString().split('T')[0]);
    }
  }, [watchedStartDate, watchedPeriod, form, isEditing]);

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Budget' : 'Create New Budget'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Groceries, Entertainment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: category.color || '#3B82F6' }}
                                />
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the expense category for this budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this budget covers..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help you remember the purpose of this budget
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Financial Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Amount *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="500.00"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>The total amount budgeted for this category</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alertThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input 
                            type="number" 
                            placeholder="80"
                            min="10"
                            max="100"
                            step="5"
                            {...field}
                            value={((field.value || 0.8) * 100).toString()}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) / 100 || 0.8)}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </FormControl>
                      <FormDescription>Get alerts when spending reaches this percentage</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <FormField
                    control={form.control}
                    name="spent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Spent</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Amount already spent (usually auto-calculated)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="carryoverAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carryover Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Amount carried over from previous period</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Period Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Period Configuration</h3>
              
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Period *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>When this budget period begins</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>When this budget period ends (auto-calculated)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resetDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reset Day</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1"
                          min="1"
                          max="31"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>Day of month/week when budget resets</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Appearance</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget Color</label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 transition-all',
                        selectedColor === color 
                          ? 'border-gray-400 scale-110' 
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold text-white"
                  style={{ backgroundColor: selectedColor }}
                >
                  💰
                </div>
                <div>
                  <div className="font-medium">
                    {form.watch('name') || 'Your Budget Name'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {form.watch('period') ? `${form.watch('period')} budget` : 'Budget preview'}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <span className={cn('font-medium', option.color)}>
                                  {option.label}
                                </span>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>How strictly should this budget be monitored?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Budget</FormLabel>
                          <FormDescription>
                            Only active budgets appear in your main budget view
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoRenew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-Renewal</FormLabel>
                          <FormDescription>
                            Automatically create new budget for next period
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rollover"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Budget Rollover</FormLabel>
                          <FormDescription>
                            Carry unused budget to the next period
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Budget' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
