'use server';

import { getDb } from '@/lib/database/connection';
import { 
  recurringTransactionsSchema, 
  transactionsSchema, 
  categoriesSchema,
  TRecurringTransaction, 
  TTransaction 
} from '@/lib/database/schemas';
import { 
  RecurringTransactionInsertSchema, 
  RecurringTransactionUpdateSchema,
  createTransactionSchema
} from '@/lib/validation/schemas';
import { eq, desc, sql, and, gte, lte, or, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type CreateRecurringTransactionInput = z.infer<typeof RecurringTransactionInsertSchema>;
type UpdateRecurringTransactionInput = z.infer<typeof RecurringTransactionUpdateSchema> & { id: string };

// Extended recurring transaction type with analytics
export type RecurringTransactionWithAnalytics = TRecurringTransaction & {
  category: {
    name: string;
    type: 'income' | 'expense' | 'debt' | 'investment' | 'savings';
    color: string;
  };
  analytics: {
    totalGenerated: number;
    totalAmount: number;
    averageAmount: number;
    nextDueDate?: string;
    daysUntilNext?: number;
    isOverdue?: boolean;
    estimatedMonthlyTotal: number;
    estimatedYearlyTotal: number;
  };
};

// Create a new recurring transaction
export async function createRecurringTransaction(input: CreateRecurringTransactionInput): Promise<TRecurringTransaction> {
  const validatedData = RecurringTransactionInsertSchema.parse(input);
  const db = getDb();
  
  const result = await db
    .insert(recurringTransactionsSchema)
    .values(validatedData)
    .returning();
    
  revalidatePath('/recurring-transactions');
  revalidatePath('/dashboard');
  
  return result[0];
}

// Get all recurring transactions with optional filtering
export async function getRecurringTransactions(filters?: {
  isActive?: boolean;
  type?: 'income' | 'expense';
  categoryId?: number;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
}): Promise<TRecurringTransaction[]> {
  const db = getDb();
  
  const conditions = [];
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(recurringTransactionsSchema.isActive, filters.isActive));
  }
  if (filters?.type) {
    conditions.push(eq(recurringTransactionsSchema.type, filters.type));
  }
  if (filters?.categoryId) {
    conditions.push(eq(recurringTransactionsSchema.categoryId, filters.categoryId));
  }
  if (filters?.frequency) {
    conditions.push(eq(recurringTransactionsSchema.frequency, filters.frequency));
  }
  
  return await db
    .select()
    .from(recurringTransactionsSchema)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recurringTransactionsSchema.createdAt));
}

// Get recurring transactions with analytics and category information
export async function getRecurringTransactionsWithAnalytics(filters?: {
  isActive?: boolean;
  type?: 'income' | 'expense';
  categoryId?: number;
  includePastDue?: boolean;
}): Promise<RecurringTransactionWithAnalytics[]> {
  const db = getDb();
  
  const conditions = [];
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(recurringTransactionsSchema.isActive, filters.isActive));
  }
  if (filters?.type) {
    conditions.push(eq(recurringTransactionsSchema.type, filters.type));
  }
  if (filters?.categoryId) {
    conditions.push(eq(recurringTransactionsSchema.categoryId, filters.categoryId));
  }
  
  // Get recurring transactions with category info
  const recurringTransactions = await db
    .select({
      recurringTransaction: recurringTransactionsSchema,
      category: {
        name: categoriesSchema.name,
        type: categoriesSchema.type,
        color: categoriesSchema.color
      }
    })
    .from(recurringTransactionsSchema)
    .leftJoin(categoriesSchema, eq(recurringTransactionsSchema.categoryId, categoriesSchema.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recurringTransactionsSchema.createdAt));

  // Calculate analytics for each recurring transaction
  const results: RecurringTransactionWithAnalytics[] = [];
  
  for (const { recurringTransaction, category } of recurringTransactions) {
    // Get count of generated transactions
    const [generatedStats] = await db
      .select({
        totalGenerated: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`COALESCE(SUM(amount), 0)`,
        averageAmount: sql<number>`COALESCE(AVG(amount), 0)`
      })
      .from(transactionsSchema)
      .where(eq(transactionsSchema.recurringTransactionId, recurringTransaction.id));

    // Calculate next due date
    const nextDueDate = calculateNextDueDate(recurringTransaction);
    const daysUntilNext = nextDueDate ? Math.ceil((new Date(nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined;
    const isOverdue = daysUntilNext !== undefined && daysUntilNext < 0;

    // Calculate estimated totals based on frequency
    const { monthlyTotal, yearlyTotal } = calculateEstimatedTotals(recurringTransaction);

    results.push({
      ...recurringTransaction,
      category: category || { name: 'Unknown', type: 'expense', color: '#gray' },
      analytics: {
        totalGenerated: generatedStats.totalGenerated,
        totalAmount: generatedStats.totalAmount,
        averageAmount: generatedStats.averageAmount,
        nextDueDate,
        daysUntilNext,
        isOverdue: filters?.includePastDue ? isOverdue : undefined,
        estimatedMonthlyTotal: monthlyTotal,
        estimatedYearlyTotal: yearlyTotal
      }
    });
  }
  
  return results;
}

// Get recurring transaction by ID
export async function getRecurringTransactionById(id: number): Promise<TRecurringTransaction | null> {
  const db = getDb();
  
  const result = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.id, id))
    .limit(1);
    
  return result[0] || null;
}

// Update a recurring transaction
export async function updateRecurringTransaction(input: UpdateRecurringTransactionInput): Promise<TRecurringTransaction> {
  const { id, ...updateData } = RecurringTransactionUpdateSchema.extend({
    id: z.string().min(1)
  }).parse(input);
  
  const db = getDb();
  
  const result = await db
    .update(recurringTransactionsSchema)
    .set(updateData)
    .where(eq(recurringTransactionsSchema.id, parseInt(id)))
    .returning();
    
  revalidatePath('/recurring-transactions');
  revalidatePath('/dashboard');
  
  return result[0];
}

// Delete a recurring transaction
export async function deleteRecurringTransaction(input: { id: string }): Promise<void> {
  const db = getDb();
  
  await db
    .delete(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.id, parseInt(input.id)));
    
  revalidatePath('/recurring-transactions');
  revalidatePath('/dashboard');
}

// Get recurring transactions that are due for generation
export async function getDueRecurringTransactions(date?: string): Promise<TRecurringTransaction[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const db = getDb();
  
  const activeRecurring = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(
      and(
        eq(recurringTransactionsSchema.isActive, true),
        eq(recurringTransactionsSchema.autoGenerate, true),
        lte(recurringTransactionsSchema.startDate, targetDate),
        or(
          isNull(recurringTransactionsSchema.endDate),
          gte(recurringTransactionsSchema.endDate, targetDate)
        )
      )
    );

  // Filter transactions that are actually due based on their frequency
  const dueTransactions = activeRecurring.filter(transaction => {
    const nextDue = calculateNextDueDate(transaction);
    return nextDue && nextDue <= targetDate;
  });

  return dueTransactions;
}

// Generate transactions from recurring patterns
export async function generateRecurringTransactions(date?: string): Promise<{
  generated: number;
  transactions: TTransaction[];
  errors: string[];
}> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const dueTransactions = await getDueRecurringTransactions(targetDate);
  
  const db = getDb();
  const generated: TTransaction[] = [];
  const errors: string[] = [];
  
  for (const recurring of dueTransactions) {
    try {
      // Check if we've already generated for this date
      const existingTransaction = await db
        .select()
        .from(transactionsSchema)
        .where(
          and(
            eq(transactionsSchema.recurringTransactionId, recurring.id),
            eq(transactionsSchema.date, targetDate)
          )
        )
        .limit(1);
        
      if (existingTransaction.length > 0) {
        continue; // Skip if already generated
      }
      
      // Check max occurrences limit
      if (recurring.maxOccurrences && recurring.generatedCount >= recurring.maxOccurrences) {
        // Deactivate the recurring transaction if max reached
        await db
          .update(recurringTransactionsSchema)
          .set({ isActive: false })
          .where(eq(recurringTransactionsSchema.id, recurring.id));
        continue;
      }
      
      // Create the transaction
      const transactionData = createTransactionSchema.parse({
        amount: recurring.amount,
        type: recurring.type,
        categoryId: recurring.categoryId,
        date: targetDate,
        description: recurring.description,
        payee: recurring.payee,
        reference: recurring.reference,
        tags: recurring.tags
      });
      
      const [newTransaction] = await db
        .insert(transactionsSchema)
        .values({
          ...transactionData,
          recurringTransactionId: recurring.id
        })
        .returning();
      
      // Update recurring transaction metadata
      await db
        .update(recurringTransactionsSchema)
        .set({
          lastGenerated: targetDate,
          generatedCount: recurring.generatedCount + 1
        })
        .where(eq(recurringTransactionsSchema.id, recurring.id));
      
      generated.push(newTransaction);
      
    } catch (error) {
      errors.push(`Failed to generate transaction for "${recurring.name}": ${error}`);
    }
  }
  
  revalidatePath('/transactions');
  revalidatePath('/recurring-transactions');
  revalidatePath('/dashboard');
  
  return {
    generated: generated.length,
    transactions: generated,
    errors
  };
}

// Toggle recurring transaction active status
export async function toggleRecurringTransactionStatus(input: { 
  id: string; 
  isActive: boolean 
}): Promise<TRecurringTransaction> {
  const db = getDb();
  
  const result = await db
    .update(recurringTransactionsSchema)
    .set({ isActive: input.isActive })
    .where(eq(recurringTransactionsSchema.id, parseInt(input.id)))
    .returning();
    
  revalidatePath('/recurring-transactions');
  
  return result[0];
}

// Get recurring transaction summary statistics
export async function getRecurringTransactionSummary() {
  const db = getDb();
  
  const stats = await db
    .select({
      totalRecurring: sql<number>`COUNT(*)`,
      activeRecurring: sql<number>`COUNT(CASE WHEN is_active = 1 THEN 1 END)`,
      incomeRecurring: sql<number>`COUNT(CASE WHEN type = 'income' THEN 1 END)`,
      expenseRecurring: sql<number>`COUNT(CASE WHEN type = 'expense' THEN 1 END)`,
      autoGenerateEnabled: sql<number>`COUNT(CASE WHEN auto_generate = 1 THEN 1 END)`,
      totalGeneratedTransactions: sql<number>`COALESCE(SUM(generated_count), 0)`,
      averageAmount: sql<number>`COALESCE(AVG(amount), 0)`,
      totalMonthlyRecurring: sql<number>`COALESCE(SUM(CASE WHEN frequency = 'monthly' THEN amount ELSE 0 END), 0)`
    })
    .from(recurringTransactionsSchema);
    
  return stats[0];
}

// Bulk operations for recurring transactions
export async function bulkUpdateRecurringTransactionStatus(input: {
  ids: string[];
  isActive: boolean;
}): Promise<void> {
  const db = getDb();
  const ids = input.ids.map(id => parseInt(id));
  
  await db
    .update(recurringTransactionsSchema)
    .set({ isActive: input.isActive })
    .where(sql`${recurringTransactionsSchema.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    
  revalidatePath('/recurring-transactions');
}

// Helper functions
function calculateNextDueDate(recurring: TRecurringTransaction): string | undefined {
  const startDate = new Date(recurring.startDate);
  const lastGenerated = recurring.lastGenerated ? new Date(recurring.lastGenerated) : null;
  const baseDate = lastGenerated || startDate;
  
  let nextDate = new Date(baseDate);
  
  switch (recurring.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + recurring.interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * recurring.interval));
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + (14 * recurring.interval));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + recurring.interval);
      if (recurring.dayOfMonth) {
        nextDate.setDate(recurring.dayOfMonth);
      }
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + (3 * recurring.interval));
      if (recurring.dayOfMonth) {
        nextDate.setDate(recurring.dayOfMonth);
      }
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + recurring.interval);
      if (recurring.monthOfYear) {
        nextDate.setMonth(recurring.monthOfYear - 1);
      }
      if (recurring.dayOfMonth) {
        nextDate.setDate(recurring.dayOfMonth);
      }
      break;
    default:
      return undefined;
  }
  
  // Check if next date exceeds end date
  if (recurring.endDate && nextDate > new Date(recurring.endDate)) {
    return undefined;
  }
  
  return nextDate.toISOString().split('T')[0];
}

function calculateEstimatedTotals(recurring: TRecurringTransaction): {
  monthlyTotal: number;
  yearlyTotal: number;
} {
  let monthlyMultiplier = 0;
  
  switch (recurring.frequency) {
    case 'daily':
      monthlyMultiplier = 30 / recurring.interval;
      break;
    case 'weekly':
      monthlyMultiplier = 4.33 / recurring.interval;
      break;
    case 'biweekly':
      monthlyMultiplier = 2.17 / recurring.interval;
      break;
    case 'monthly':
      monthlyMultiplier = 1 / recurring.interval;
      break;
    case 'quarterly':
      monthlyMultiplier = 0.33 / recurring.interval;
      break;
    case 'yearly':
      monthlyMultiplier = 0.083 / recurring.interval;
      break;
  }
  
  const monthlyTotal = recurring.amount * monthlyMultiplier;
  const yearlyTotal = monthlyTotal * 12;
  
  return { monthlyTotal, yearlyTotal };
}
