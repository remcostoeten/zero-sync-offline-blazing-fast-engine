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

// Natural Language Search Functions
type TNaturalLanguageSearchResult = {
  searchParams: {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    categories?: string[];
    description?: string;
    payee?: string;
    type?: 'income' | 'expense';
  };
  confidence: number;
  interpretation: string;
  alternatives?: string[];
};

type TSmartSearchResult = {
  transactions: (TTransaction & { category: { name: string; type: string; color?: string } })[];
  searchSummary: {
    totalResults: number;
    interpretation: string;
    confidence: number;
    appliedFilters: string[];
    suggestions?: string[];
  };
};

export async function searchTransactionsNaturalLanguage(query: string): Promise<TSmartSearchResult> {
  try {
    // First, get available categories for better AI parsing
    const db = getDb();
    const categories = await db
      .selectDistinct({ name: categoriesSchema.name })
      .from(categoriesSchema)
      .where(eq(categoriesSchema.isActive, true));
    
    const categoryNames = categories.map(c => c.name);
    
    // Parse the natural language query
    const parsedQuery = await parseSearchIntent(query, categoryNames);
    
    // Execute the search with parsed parameters
    const searchResult = await executeSmartSearch(parsedQuery);
    
    return searchResult;
  } catch (error) {
    console.error('Natural language search error:', error);
    // Fallback to regular text search
    const fallbackResults = await searchTransactions(query, 50);
    return {
      transactions: fallbackResults,
      searchSummary: {
        totalResults: fallbackResults.length,
        interpretation: `Searching for "${query}" using text matching (AI unavailable)`,
        confidence: 60,
        appliedFilters: ['description', 'payee'],
        suggestions: ['Try using specific dates like "last month"', 'Include amount ranges like "under $50"']
      }
    };
  }
}

export async function parseSearchIntent(query: string, availableCategories: string[] = []): Promise<TNaturalLanguageSearchResult> {
  try {
    // Import gemini analyzer dynamically to avoid server-side issues
    const { geminiAnalyzer } = await import('@/lib/gemini');
    return await geminiAnalyzer.parseNaturalLanguageQuery(query, availableCategories);
  } catch (error) {
    console.error('Intent parsing error:', error);
    // Fallback parsing using simple regex patterns
    return parseSearchIntentFallback(query, availableCategories);
  }
}

export async function executeSmartSearch(
  parsedQuery: TNaturalLanguageSearchResult
): Promise<TSmartSearchResult> {
  const db = getDb();
  const { searchParams } = parsedQuery;
  
  // Build dynamic query conditions
  const conditions = [];
  const appliedFilters = [];
  
  if (searchParams.startDate) {
    conditions.push(gte(transactionsSchema.date, searchParams.startDate));
    appliedFilters.push(`After ${searchParams.startDate}`);
  }
  
  if (searchParams.endDate) {
    conditions.push(lte(transactionsSchema.date, searchParams.endDate));
    appliedFilters.push(`Before ${searchParams.endDate}`);
  }
  
  if (searchParams.minAmount !== undefined) {
    conditions.push(gte(transactionsSchema.amount, searchParams.minAmount));
    appliedFilters.push(`Amount ≥ ${searchParams.minAmount}`);
  }
  
  if (searchParams.maxAmount !== undefined) {
    conditions.push(lte(transactionsSchema.amount, searchParams.maxAmount));
    appliedFilters.push(`Amount ≤ ${searchParams.maxAmount}`);
  }
  
  if (searchParams.type) {
    conditions.push(eq(transactionsSchema.type, searchParams.type));
    appliedFilters.push(`Type: ${searchParams.type}`);
  }
  
  if (searchParams.categories && searchParams.categories.length > 0) {
    conditions.push(inArray(categoriesSchema.name, searchParams.categories));
    appliedFilters.push(`Categories: ${searchParams.categories.join(', ')}`);
  }
  
  // Build text search conditions
  const textConditions = [];
  if (searchParams.description) {
    textConditions.push(like(transactionsSchema.description, `%${searchParams.description}%`));
  }
  if (searchParams.payee) {
    textConditions.push(like(transactionsSchema.payee, `%${searchParams.payee}%`));
  }
  
  if (textConditions.length > 0) {
    conditions.push(or(...textConditions));
    appliedFilters.push('Text search');
  }
  
  // Execute the query
  let query = db
    .select({
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
      category: {
        name: categoriesSchema.name,
        type: categoriesSchema.type,
        color: categoriesSchema.color
      }
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .orderBy(desc(transactionsSchema.date));
    
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  const results = await query.limit(100);
  
  // Generate suggestions based on confidence and results
  const suggestions = [];
  if (parsedQuery.confidence < 70) {
    suggestions.push('Try being more specific with dates or amounts');
  }
  if (results.length === 0) {
    suggestions.push('Try expanding your date range', 'Check if category names are correct');
  }
  if (parsedQuery.alternatives) {
    suggestions.push(...parsedQuery.alternatives);
  }
  
  return {
    transactions: results as any,
    searchSummary: {
      totalResults: results.length,
      interpretation: parsedQuery.interpretation,
      confidence: parsedQuery.confidence,
      appliedFilters,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    }
  };
}

// Fallback parsing when AI is unavailable
function parseSearchIntentFallback(
  query: string,
  availableCategories: string[]
): TNaturalLanguageSearchResult {
  const searchParams: any = {};
  const lowerQuery = query.toLowerCase();
  let confidence = 40;
  const alternatives = [];
  
  // Simple amount parsing
  const amountRegex = /(\d+(?:\.\d{2})?)/g;
  const amounts = query.match(amountRegex);
  if (amounts) {
    const numericAmounts = amounts.map(a => parseFloat(a));
    if (lowerQuery.includes('around') || lowerQuery.includes('roughly')) {
      const amount = numericAmounts[0];
      searchParams.minAmount = amount * 0.8;
      searchParams.maxAmount = amount * 1.2;
      confidence += 15;
    } else if (lowerQuery.includes('under') || lowerQuery.includes('less')) {
      searchParams.maxAmount = numericAmounts[0];
      confidence += 15;
    } else if (lowerQuery.includes('over') || lowerQuery.includes('more')) {
      searchParams.minAmount = numericAmounts[0];
      confidence += 15;
    }
  }
  
  // Simple date parsing
  const now = new Date();
  if (lowerQuery.includes('last month')) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    searchParams.startDate = lastMonth.toISOString().split('T')[0];
    searchParams.endDate = lastMonthEnd.toISOString().split('T')[0];
    confidence += 20;
  } else if (lowerQuery.includes('this month')) {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    searchParams.startDate = thisMonth.toISOString().split('T')[0];
    searchParams.endDate = now.toISOString().split('T')[0];
    confidence += 20;
  } else if (lowerQuery.includes('months ago')) {
    const monthsMatch = query.match(/(\d+)\s+months?\s+ago/);
    if (monthsMatch) {
      const monthsAgo = parseInt(monthsMatch[1]);
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
      searchParams.startDate = startDate.toISOString().split('T')[0];
      confidence += 20;
    }
  }
  
  // Category matching
  const matchedCategories = availableCategories.filter(category => 
    lowerQuery.includes(category.toLowerCase())
  );
  if (matchedCategories.length > 0) {
    searchParams.categories = matchedCategories;
    confidence += 20;
  }
  
  // Transaction type inference
  if (lowerQuery.includes('salary') || lowerQuery.includes('income') || lowerQuery.includes('payment received')) {
    searchParams.type = 'income';
    confidence += 15;
  } else if (lowerQuery.includes('bought') || lowerQuery.includes('spent') || lowerQuery.includes('paid for')) {
    searchParams.type = 'expense';
    confidence += 15;
  }
  
  // Extract description keywords
  const stopWords = ['i', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'ago', 'around', 'roughly', 'about'];
  const words = query.toLowerCase().split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word) && !amountRegex.test(word)
  );
  
  if (words.length > 0) {
    searchParams.description = words[0]; // Use first meaningful word
    confidence += 10;
  }
  
  let interpretation = 'Searching for transactions';
  if (searchParams.description) interpretation += ` containing "${searchParams.description}"`;
  if (searchParams.minAmount || searchParams.maxAmount) {
    interpretation += ` with amount ${searchParams.minAmount ? `≥${searchParams.minAmount}` : ''}${searchParams.minAmount && searchParams.maxAmount ? ' and ' : ''}${searchParams.maxAmount ? `≤${searchParams.maxAmount}` : ''}`;
  }
  if (searchParams.startDate) interpretation += ` from ${searchParams.startDate}`;
  if (searchParams.categories) interpretation += ` in ${searchParams.categories.join(', ')} categories`;
  
  if (confidence < 60) {
    alternatives.push(
      'Try using specific dates like "last month"',
      'Include amount ranges like "around $50"',
      'Mention specific categories or merchants'
    );
  }
  
  return {
    searchParams,
    confidence,
    interpretation,
    alternatives: alternatives.length > 0 ? alternatives : undefined
  };
}
