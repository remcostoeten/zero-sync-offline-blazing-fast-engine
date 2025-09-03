'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RecurringTransactionInsertSchema, RecurringTransactionFormData } from '@/lib/validation/schemas';
import { TRecurringTransaction, TCategory } from '@/lib/database/schemas';
import { createRecurringTransaction, updateRecurringTransaction } from '../actions';
import { getCategories } from '@/features/categories/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarDays, 
  DollarSign, 
  Repeat, 
  Settings,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RecurringTransactionFormProps {
  transaction?: TRecurringTransaction;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RecurringTransactionForm({
  transaction,
  isOpen,
  onOpenChange,
  onSuccess
}: RecurringTransactionFormProps) {
  const [categories, setCategories] = useState<TCategory[]>([]);
  const [tags, setTags] = useState<string[]>(transaction?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecurringTransactionFormData>({
    resolver: zodResolver(RecurringTransactionInsertSchema),
    defaultValues: {
      name: transaction?.name || '',
      description: transaction?.description || '',
      categoryId: transaction?.categoryId || 0,
      amount: transaction?.amount || 0,
      type: transaction?.type || 'expense',
      frequency: transaction?.frequency || 'monthly',
      interval: transaction?.interval || 1,
      dayOfWeek: transaction?.dayOfWeek || undefined,
      dayOfMonth: transaction?.dayOfMonth || 1,
      monthOfYear: transaction?.monthOfYear || undefined,
      startDate: transaction?.startDate || new Date().toISOString().split('T')[0],
      endDate: transaction?.endDate || undefined,
      maxOccurrences: transaction?.maxOccurrences || undefined,
      isActive: transaction?.isActive ?? true,
      autoGenerate: transaction?.autoGenerate ?? true,
      notifyOnGeneration: transaction?.notifyOnGeneration ?? false,
      payee: transaction?.payee || '',
      reference: transaction?.reference || '',
      tags: transaction?.tags || []
    }
  });

  const watchedFrequency = form.watch('frequency');
  const watchedType = form.watch('type');

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        toast.error('Failed to load categories');
      }
    }
    
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Auto-generate name based on form data
  useEffect(() => {
    const categoryId = form.watch('categoryId');
    const amount = form.watch('amount');
    const frequency = form.watch('frequency');
    
    if (categoryId && amount && frequency && !transaction) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        const frequencyText = frequency.charAt(0).toUpperCase() + frequency.slice(1);
        const generatedName = `${frequencyText} ${category.name} - $${amount}`;
        form.setValue('name', generatedName);
      }
    }
  }, [form.watch('categoryId'), form.watch('amount'), form.watch('frequency'), categories, transaction]);

  const handleSubmit = async (data: RecurringTransactionFormData) => {
    setIsSubmitting(true);
    
    try {
      const formData = {
        ...data,
        tags: tags
      };

      if (transaction) {
        await updateRecurringTransaction({ 
          ...formData, 
          id: transaction.id.toString() 
        });
        toast.success('Recurring transaction updated successfully');
      } else {
        await createRecurringTransaction(formData);
        toast.success('Recurring transaction created successfully');
      }
      
      onSuccess?.();
      onOpenChange(false);
      form.reset();
      setTags([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save recurring transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Calculate next due date for preview
  const calculatePreviewDate = () => {
    const startDate = form.watch('startDate');
    const frequency = form.watch('frequency');
    const interval = form.watch('interval') || 1;
    const dayOfMonth = form.watch('dayOfMonth');
    const monthOfYear = form.watch('monthOfYear');
    
    if (!startDate) return null;
    
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (7 * interval));
        break;
      case 'biweekly':
        date.setDate(date.getDate() + (14 * interval));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + interval);
        if (dayOfMonth) date.setDate(dayOfMonth);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (3 * interval));
        if (dayOfMonth) date.setDate(dayOfMonth);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + interval);
        if (monthOfYear) date.setMonth(monthOfYear - 1);
        if (dayOfMonth) date.setDate(dayOfMonth);
        break;
    }
    
    return date.toISOString().split('T')[0];
  };

  const previewDate = calculatePreviewDate();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <h3 className="font-medium">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Rent Payment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">
                            <span className="text-green-600">Income</span>
                          </SelectItem>
                          <SelectItem value="expense">
                            <span className="text-red-600">Expense</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories
                            .filter(category => !watchedType || category.type === watchedType || category.type === 'debt' || category.type === 'investment' || category.type === 'savings')
                            .map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional details..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Frequency & Schedule */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                <h3 className="font-medium">Frequency & Schedule</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Every {field.value || 1} {watchedFrequency}(s)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Frequency-specific fields */}
              {watchedFrequency === 'weekly' && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(watchedFrequency === 'monthly' || watchedFrequency === 'quarterly' || watchedFrequency === 'yearly') && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedFrequency === 'yearly' && (
                <FormField
                  control={form.control}
                  name="monthOfYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month of Year</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxOccurrences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Occurrences (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Leave empty for unlimited"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Limit the number of times this transaction will be generated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {previewDate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">Next due: {previewDate}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Additional Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h3 className="font-medium">Additional Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payee (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Landlord, Utility Company" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Account #, Invoice #" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)} 
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h3 className="font-medium">Settings</h3>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Whether this recurring transaction is active
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
                  name="autoGenerate"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Auto-Generate</FormLabel>
                        <FormDescription>
                          Automatically create transactions when due
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
                  name="notifyOnGeneration"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Notify on Generation</FormLabel>
                        <FormDescription>
                          Send notification when transactions are auto-generated
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

            <DialogFooter className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (transaction ? 'Updating...' : 'Creating...') 
                  : (transaction ? 'Update Transaction' : 'Create Transaction')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
