import { createCrudFactory, createDb } from '../../../../shared';
import {
  recurringTransactionsSchema,
  transactionsSchema,
  categoriesSchema,
  TRecurringTransactionInsert,
  TRecurringTransactionSelect,
  TRecurringTransaction,
  TTransactionInsert
} from '../../../../shared/schemas';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { 
  calculateNextExecutionDate,
  getRecurringTransactionById,
  TRecurringTransactionWithDetails 
} from '../queries';

const recurringCrud = createCrudFactory<typeof recurringTransactionsSchema, TRecurringTransactionInsert, TRecurringTransactionSelect>(recurringTransactionsSchema)();
const transactionCrud = createCrudFactory<typeof transactionsSchema, TTransactionInsert, any>(transactionsSchema)();

type TRecurringTransactionCreateData = Omit<TRecurringTransactionInsert, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'generatedCount' | 'lastGenerated'>;
type TRecurringTransactionUpdateData = Partial<TRecurringTransactionCreateData> & { id: number };

type TGenerationResult = {
  recurringId: number;
  recurringName: string;
  generatedCount: number;
  skippedCount: number;
  errorCount: number;
  nextExecution: string | null;
  transactions: {
    id?: number;
    date: string;
    amount: number;
    status: 'generated' | 'skipped' | 'error';
    reason?: string;
  }[];
};

type TGenerateTransactionsOptions = {
  recurringId?: number;
  fromDate?: string;
  toDate?: string;
  dryRun?: boolean;
  force?: boolean;
  maxTransactions?: number;
};

// Date utilities for transaction generation
function addInterval(date: Date, frequency: string, interval: number = 1): Date {
  const newDate = new Date(date);
  
  switch (frequency) {
    case 'daily':
      newDate.setDate(newDate.getDate() + interval);
      break;
    case 'weekly':
      newDate.setDate(newDate.getDate() + (7 * interval));
      break;
    case 'biweekly':
      newDate.setDate(newDate.getDate() + (14 * interval));
      break;
    case 'monthly':
      newDate.setMonth(newDate.getMonth() + interval);
      break;
    case 'quarterly':
      newDate.setMonth(newDate.getMonth() + (3 * interval));
      break;
    case 'yearly':
      newDate.setFullYear(newDate.getFullYear() + interval);
      break;
  }
  
  return newDate;
}

async function createRecurringTransaction(data: TRecurringTransactionCreateData): Promise<TRecurringTransaction> {
  const db = createDb();
  
  // Validate category exists
  const category = await db
    .select({ id: categoriesSchema.id })
    .from(categoriesSchema)
    .where(eq(categoriesSchema.id, data.categoryId))
    .limit(1);
    
  if (!category[0]) {
    throw new Error('Category not found');
  }
  
  // Initialize tracking fields
  const recurringData: TRecurringTransactionInsert = {
    ...data,
    generatedCount: 0,
    lastGenerated: null
  };
  
  return await recurringCrud.create(recurringData);
}

async function updateRecurringTransaction(data: TRecurringTransactionUpdateData): Promise<TRecurringTransaction> {
  const { id, ...updateData } = data;
  
  if (updateData.categoryId) {
    const db = createDb();
    
    // Validate category exists
    const category = await db
      .select({ id: categoriesSchema.id })
      .from(categoriesSchema)
      .where(eq(categoriesSchema.id, updateData.categoryId))
      .limit(1);
      
    if (!category[0]) {
      throw new Error('Category not found');
    }
  }
  
  return await recurringCrud.update(id, updateData);
}

async function deleteRecurringTransaction(id: number, deleteGeneratedTransactions: boolean = false): Promise<boolean> {
  const db = createDb();
  
  if (deleteGeneratedTransactions) {
    // Delete all generated transactions
    await db
      .delete(transactionsSchema)
      .where(eq(transactionsSchema.recurringTransactionId, id));
  }
  
  return await recurringCrud.delete(id);
}

async function toggleRecurringTransactionStatus(id: number): Promise<TRecurringTransaction> {
  const db = createDb();
  
  const recurring = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.id, id))
    .limit(1);
    
  if (!recurring[0]) {
    throw new Error('Recurring transaction not found');
  }
  
  return await recurringCrud.update(id, { isActive: !recurring[0].isActive });
}

async function updateRecurringSchedule(
  id: number,
  updates: {
    isActive?: boolean;
    autoGenerate?: boolean;
    nextExecutionDate?: string;
    pauseUntil?: string;
    skipNext?: boolean;
  }
): Promise<TRecurringTransactionWithDetails> {
  const db = createDb();
  
  const recurring = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.id, id))
    .limit(1);
    
  if (!recurring[0]) {
    throw new Error('Recurring transaction not found');
  }
  
  const updateData: Partial<TRecurringTransactionInsert> = {};
  
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }
  
  if (updates.autoGenerate !== undefined) {
    updateData.autoGenerate = updates.autoGenerate;
  }
  
  // Handle pause until logic
  if (updates.pauseUntil) {
    updateData.isActive = false;
    // Could store pauseUntil in a separate field or handle in application logic
  }
  
  await recurringCrud.update(id, updateData);
  
  const updatedRecurring = await getRecurringTransactionById(id);
  if (!updatedRecurring) {
    throw new Error('Failed to retrieve updated recurring transaction');
  }
  
  return updatedRecurring;
}

async function generateTransactionsForRecurring(
  recurringId: number,
  options: TGenerateTransactionsOptions = {}
): Promise<TGenerationResult> {
  const db = createDb();
  
  // Get recurring transaction
  const recurring = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.id, recurringId))
    .limit(1);
    
  if (!recurring[0]) {
    throw new Error('Recurring transaction not found');
  }
  
  const recurringData = recurring[0];
  
  if (!recurringData.isActive || !recurringData.autoGenerate) {
    return {
      recurringId,
      recurringName: recurringData.name,
      generatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      nextExecution: null,
      transactions: []
    };
  }
  
  const fromDate = options.fromDate || (recurringData.lastGenerated || recurringData.startDate);
  const toDate = options.toDate || new Date().toISOString().split('T')[0];
  const maxTransactions = options.maxTransactions || 100;
  const force = options.force || false;
  const dryRun = options.dryRun || false;
  
  const generatedTransactions: TGenerationResult['transactions'] = [];
  let generatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Generate dates for the period
  const datesToGenerate: string[] = [];
  let currentDate = new Date(fromDate);
  const endDate = new Date(toDate);
  
  // Apply frequency-specific initial date adjustments
  if (recurringData.frequency === 'weekly' && recurringData.dayOfWeek !== null) {
    const dayDiff = recurringData.dayOfWeek - currentDate.getDay();
    if (dayDiff > 0) {
      currentDate.setDate(currentDate.getDate() + dayDiff);
    }
  } else if ((recurringData.frequency === 'monthly' || recurringData.frequency === 'quarterly') && recurringData.dayOfMonth) {
    currentDate.setDate(recurringData.dayOfMonth);
  } else if (recurringData.frequency === 'yearly' && recurringData.dayOfMonth && recurringData.monthOfYear) {
    currentDate.setMonth(recurringData.monthOfYear - 1, recurringData.dayOfMonth);
  }
  
  // Skip the first occurrence if it's exactly the last generated date (to avoid duplicates)
  if (recurringData.lastGenerated && currentDate.toISOString().split('T')[0] === recurringData.lastGenerated) {
    currentDate = addInterval(currentDate, recurringData.frequency, recurringData.interval || 1);
  }
  
  let occurrenceCount = recurringData.generatedCount || 0;
  
  while (currentDate <= endDate && datesToGenerate.length < maxTransactions) {
    // Check end conditions
    if (recurringData.endDate && currentDate > new Date(recurringData.endDate)) {
      break;
    }
    if (recurringData.maxOccurrences && occurrenceCount >= recurringData.maxOccurrences) {
      break;
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if date is in the future from start date
    if (currentDate >= new Date(recurringData.startDate)) {
      datesToGenerate.push(dateStr);
      occurrenceCount++;
    }
    
    // Calculate next occurrence
    currentDate = addInterval(currentDate, recurringData.frequency, recurringData.interval || 1);
    
    // Re-apply day constraints for certain frequencies
    if (recurringData.frequency === 'monthly' || recurringData.frequency === 'quarterly') {
      if (recurringData.dayOfMonth) {
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        currentDate.setDate(Math.min(recurringData.dayOfMonth, lastDay));
      }
    } else if (recurringData.frequency === 'yearly') {
      if (recurringData.monthOfYear && recurringData.dayOfMonth) {
        currentDate.setMonth(recurringData.monthOfYear - 1, recurringData.dayOfMonth);
      }
    }
  }
  
  // Process each date for transaction generation
  for (const date of datesToGenerate) {
    try {
      // Check if transaction already exists for this date (unless forced)
      if (!force) {
        const existingTransaction = await db
          .select()
          .from(transactionsSchema)
          .where(and(
            eq(transactionsSchema.recurringTransactionId, recurringId),
            eq(transactionsSchema.date, date)
          ))
          .limit(1);
          
        if (existingTransaction[0]) {
          generatedTransactions.push({
            date,
            amount: recurringData.amount,
            status: 'skipped',
            reason: 'Transaction already exists for this date'
          });
          skippedCount++;
          continue;
        }
      }
      
      if (!dryRun) {
        // Create the actual transaction
        const transactionData: TTransactionInsert = {
          amount: recurringData.amount,
          type: recurringData.type,
          categoryId: recurringData.categoryId,
          date: date,
          description: `${recurringData.name} - ${recurringData.frequency} recurring`,
          payee: recurringData.payee,
          reference: recurringData.reference,
          tags: recurringData.tags || [],
          recurringTransactionId: recurringId
        };
        
        const createdTransaction = await transactionCrud.create(transactionData);
        
        generatedTransactions.push({
          id: createdTransaction.id,
          date,
          amount: recurringData.amount,
          status: 'generated'
        });
        
        generatedCount++;
      } else {
        // Dry run - just record what would be generated
        generatedTransactions.push({
          date,
          amount: recurringData.amount,
          status: 'generated'
        });
        generatedCount++;
      }
      
    } catch (error) {
      console.error(`Error generating transaction for date ${date}:`, error);
      
      generatedTransactions.push({
        date,
        amount: recurringData.amount,
        status: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      
      errorCount++;
    }
  }
  
  // Update recurring transaction counters (if not dry run)
  if (!dryRun && generatedCount > 0) {
    const lastGeneratedDate = datesToGenerate[datesToGenerate.length - 1];
    await recurringCrud.update(recurringId, {
      generatedCount: (recurringData.generatedCount || 0) + generatedCount,
      lastGenerated: lastGeneratedDate
    });
  }
  
  // Calculate next execution date
  const nextExecution = calculateNextExecutionDate(recurringData);
  
  return {
    recurringId,
    recurringName: recurringData.name,
    generatedCount,
    skippedCount,
    errorCount,
    nextExecution,
    transactions: generatedTransactions
  };
}

async function generateTransactionsForAll(options: TGenerateTransactionsOptions = {}): Promise<TGenerationResult[]> {
  const db = createDb();
  
  // Get all active recurring transactions with autoGenerate enabled
  const recurringTransactions = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(and(
      eq(recurringTransactionsSchema.isActive, true),
      eq(recurringTransactionsSchema.autoGenerate, true)
    ));
  
  const results: TGenerationResult[] = [];
  
  for (const recurring of recurringTransactions) {
    try {
      const result = await generateTransactionsForRecurring(recurring.id, options);
      results.push(result);
    } catch (error) {
      console.error(`Error generating transactions for recurring ${recurring.id}:`, error);
      results.push({
        recurringId: recurring.id,
        recurringName: recurring.name,
        generatedCount: 0,
        skippedCount: 0,
        errorCount: 1,
        nextExecution: null,
        transactions: [{
          date: new Date().toISOString().split('T')[0],
          amount: recurring.amount,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        }]
      });
    }
  }
  
  return results;
}

async function bulkCreateRecurringTransactions(transactions: TRecurringTransactionCreateData[]): Promise<TRecurringTransaction[]> {
  const results: TRecurringTransaction[] = [];
  
  for (const data of transactions) {
    try {
      const recurring = await createRecurringTransaction(data);
      results.push(recurring);
    } catch (error) {
      console.error(`Failed to create recurring transaction:`, error);
      // Continue with other transactions
    }
  }
  
  return results;
}

async function bulkUpdateRecurringTransactions(updates: TRecurringTransactionUpdateData[]): Promise<TRecurringTransaction[]> {
  const results: TRecurringTransaction[] = [];
  
  for (const data of updates) {
    try {
      const recurring = await updateRecurringTransaction(data);
      results.push(recurring);
    } catch (error) {
      console.error(`Failed to update recurring transaction ${data.id}:`, error);
    }
  }
  
  return results;
}

async function bulkDeleteRecurringTransactions(
  ids: number[], 
  deleteGeneratedTransactions: boolean = false
): Promise<{ deleted: number[]; failed: number[] }> {
  const deleted: number[] = [];
  const failed: number[] = [];
  
  for (const id of ids) {
    try {
      const success = await deleteRecurringTransaction(id, deleteGeneratedTransactions);
      if (success) {
        deleted.push(id);
      } else {
        failed.push(id);
      }
    } catch (error) {
      console.error(`Failed to delete recurring transaction ${id}:`, error);
      failed.push(id);
    }
  }
  
  return { deleted, failed };
}

export {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransactionStatus,
  updateRecurringSchedule,
  generateTransactionsForRecurring,
  generateTransactionsForAll,
  bulkCreateRecurringTransactions,
  bulkUpdateRecurringTransactions,
  bulkDeleteRecurringTransactions,
  TGenerationResult
};
