'use server';

import { getDb } from '@/lib/database/connection';
import { transactionsSchema, categoriesSchema, TTransaction } from '@/lib/database/schemas';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/validation/schemas';
import { eq, desc, asc, and, or, between, gte, lte, sql, like, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// Create a new transaction
export async function createTransaction(input: CreateTransactionInput): Promise<TTransaction> {
  const validatedData = createTransactionSchema.parse(input);
  const db = getDb();
  
  // Verify category exists and get its type
  const category = await db
    .select()
    .from(categoriesSchema)
    .where(eq(categoriesSchema.id, validatedData.categoryId))
    .limit(1);
    
  if (category.length === 0) {
    throw new Error('Category not found');
  }
  
  // Auto-set transaction type based on category type if not provided
  const transactionType = validatedData.type;
  const categoryType = category[0].type;
  
  // Validate transaction type matches category context
  if ((categoryType === 'income' && transactionType === 'expense') ||
      ((categoryType === 'expense' || categoryType === 'debt') && transactionType === 'income')) {
    console.warn(`Transaction type (${transactionType}) may not match category type (${categoryType})`);
  }
  
  const result = await db
    .insert(transactionsSchema)
    .values({
      ...validatedData,
      tags: validatedData.tags || []
    })
    .returning();
    
  revalidatePath('/transactions');
  
  return result[0];
}

// Get all transactions with category information
export async function getTransactions(filters?: {
  categoryId?: number;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<(TTransaction & { category: { name: string; type: string; color?: string } })[]> {
  const db = getDb();
  
  let query = db
    .select({
      // Transaction fields
      id: transactionsSchema.id,
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      categoryId: transactionsSchema.categoryId,
      date: transactionsSchema.date,
      description: transactionsSchema.description,
      payee: transactionsSchema.payee,
      reference: transactionsSchema.reference,
      tags: transactionsSchema.tags,
      createdAt: transactionsSchema.createdAt,
      updatedAt: transactionsSchema.updatedAt,
      synced: transactionsSchema.synced,
      recurringTransactionId: transactionsSchema.recurringTransactionId,
      savingsGoalId: transactionsSchema.savingsGoalId,
      debtPaymentId: transactionsSchema.debtPaymentId,
      // Category fields
      category: {
        name: categoriesSchema.name,
        type: categoriesSchema.type,
        color: categoriesSchema.color
      }
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .orderBy(desc(transactionsSchema.date), desc(transactionsSchema.createdAt));
    
  // Apply filters
  const conditions = [];
  if (filters?.categoryId) {
    conditions.push(eq(transactionsSchema.categoryId, filters.categoryId));
  }
  if (filters?.type) {
    conditions.push(eq(transactionsSchema.type, filters.type));
  }
  if (filters?.startDate) {
    conditions.push(gte(transactionsSchema.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(transactionsSchema.date, filters.endDate));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  return await query as any;
}

// Get transaction by ID
export async function getTransactionById(id: number): Promise<TTransaction | null> {
  const db = getDb();
  
  const result = await db
    .select()
    .from(transactionsSchema)
    .where(eq(transactionsSchema.id, id))
    .limit(1);
    
  return result[0] || null;
}

// Update a transaction
export async function updateTransaction(input: UpdateTransactionInput): Promise<TTransaction> {
  const validatedData = updateTransactionSchema.parse(input);
  const { id, ...updateData } = validatedData;
  const db = getDb();
  
  // Verify category exists if categoryId is being updated
  if (updateData.categoryId) {
    const category = await db
      .select()
      .from(categoriesSchema)
      .where(eq(categoriesSchema.id, updateData.categoryId))
      .limit(1);
      
    if (category.length === 0) {
      throw new Error('Category not found');
    }
  }
  
  const result = await db
    .update(transactionsSchema)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(transactionsSchema.id, parseInt(id!)))
    .returning();
    
  revalidatePath('/transactions');
  
  return result[0];
}

// Delete a transaction
export async function deleteTransaction(input: { id: string }): Promise<void> {
  const db = getDb();
  
  await db
    .delete(transactionsSchema)
    .where(eq(transactionsSchema.id, parseInt(input.id)));
    
  revalidatePath('/transactions');
}

// Get transaction summary statistics
export async function getTransactionSummary(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
}) {
  const db = getDb();
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(transactionsSchema.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(transactionsSchema.date, filters.endDate));
  }
  if (filters?.categoryId) {
    conditions.push(eq(transactionsSchema.categoryId, filters.categoryId));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [summary] = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
      netAmount: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)`
    })
    .from(transactionsSchema)
    .where(whereClause);
    
  return summary;
}

// Search transactions with text search
export async function searchTransactions(
  searchTerm: string,
  limit: number = 50
): Promise<(TTransaction & { category: { name: string; type: string; color?: string } })[]> {
  const db = getDb();
  
  const results = await db
    .select({
      // Transaction fields
      id: transactionsSchema.id,
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      categoryId: transactionsSchema.categoryId,
      date: transactionsSchema.date,
      description: transactionsSchema.description,
      payee: transactionsSchema.payee,
      reference: transactionsSchema.reference,
      tags: transactionsSchema.tags,
      createdAt: transactionsSchema.createdAt,
      updatedAt: transactionsSchema.updatedAt,
      synced: transactionsSchema.synced,
      recurringTransactionId: transactionsSchema.recurringTransactionId,
      savingsGoalId: transactionsSchema.savingsGoalId,
      debtPaymentId: transactionsSchema.debtPaymentId,
      // Category fields
      category: {
        name: categoriesSchema.name,
        type: categoriesSchema.type,
        color: categoriesSchema.color
      }
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(
      or(
        like(transactionsSchema.description, `%${searchTerm}%`),
        like(transactionsSchema.payee, `%${searchTerm}%`),
        like(transactionsSchema.reference, `%${searchTerm}%`),
        like(categoriesSchema.name, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(transactionsSchema.date))
    .limit(limit);
    
  return results as any;
}

// Get unique payees for autocomplete
export async function getPayees(limit: number = 100): Promise<string[]> {
  const db = getDb();
  
  const results = await db
    .selectDistinct({
      payee: transactionsSchema.payee
    })
    .from(transactionsSchema)
    .where(sql`${transactionsSchema.payee} IS NOT NULL AND ${transactionsSchema.payee} != ''`)
    .orderBy(transactionsSchema.payee)
    .limit(limit);
    
  return results.map(r => r.payee!).filter(Boolean);
}

// Get transaction analytics for dashboard
export async function getTransactionAnalytics(filters?: {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
}) {
  const db = getDb();
  
  const conditions = [];
  if (filters?.startDate && filters?.endDate) {
    conditions.push(
      between(transactionsSchema.date, filters.startDate, filters.endDate)
    );
  }
  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    conditions.push(inArray(transactionsSchema.categoryId, filters.categoryIds));
  }

  // Get category breakdown
  const categoryBreakdown = await db
    .select({
      categoryId: transactionsSchema.categoryId,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      total: sql<number>`SUM(amount)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(transactionsSchema.categoryId, categoriesSchema.name, categoriesSchema.color)
    .orderBy(desc(sql`SUM(amount)`));

  // Get monthly trends
  const monthlyTrends = await db
    .select({
      month: sql<string>`strftime('%Y-%m', date)`,
      income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, 
          new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString().split('T')[0]
        ),
        ...(conditions.length > 0 ? conditions : [])
      )
    )
    .groupBy(sql`strftime('%Y-%m', date)`)
    .orderBy(sql`strftime('%Y-%m', date)`);

  return {
    categoryBreakdown,
    monthlyTrends: monthlyTrends.map(trend => ({
      ...trend,
      net: trend.income - trend.expenses
    }))
  };
}

// Bulk delete transactions
export async function deleteTransactions(input: { ids: string[] }): Promise<void> {
  const db = getDb();
  const ids = input.ids.map(id => parseInt(id));
  
  await db
    .delete(transactionsSchema)
    .where(inArray(transactionsSchema.id, ids));
    
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
}
