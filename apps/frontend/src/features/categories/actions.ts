'use server';

import { getDb } from '@/lib/database/connection';
import { categoriesSchema, TCategory } from '@/lib/database/schemas';
import { createCategorySchema, updateCategorySchema } from '@/lib/validation/schemas';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Create a new category
export async function createCategory(input: CreateCategoryInput): Promise<TCategory> {
  const validatedData = createCategorySchema.parse(input);
  const db = getDb();
  
  const result = await db
    .insert(categoriesSchema)
    .values(validatedData)
    .returning();
    
  revalidatePath('/categories');
  
  return result[0];
}

// Get all categories
export async function getCategories(): Promise<TCategory[]> {
  const db = getDb();
  return await db.select().from(categoriesSchema);
}

// Get category by ID
export async function getCategoryById(id: number): Promise<TCategory | null> {
  const db = getDb();
  
  const result = await db
    .select()
    .from(categoriesSchema)
    .where(eq(categoriesSchema.id, id))
    .limit(1);
    
  return result[0] || null;
}

// Update a category
export async function updateCategory(input: UpdateCategoryInput): Promise<TCategory> {
  const validatedData = updateCategorySchema.parse(input);
  const { id, ...updateData } = validatedData;
  const db = getDb();
  
  const result = await db
    .update(categoriesSchema)
    .set(updateData)
    .where(eq(categoriesSchema.id, parseInt(id!)))
    .returning();
    
  revalidatePath('/categories');
  
  return result[0];
}

// Delete a category
export async function deleteCategory(input: { id: string }): Promise<void> {
  const db = getDb();
  
  await db
    .delete(categoriesSchema)
    .where(eq(categoriesSchema.id, parseInt(input.id)));
    
  revalidatePath('/categories');
}

// Import transactions schema for analytics
import { transactionsSchema } from '@/lib/database/schemas';

// Extended category type with analytics
export type CategoryWithAnalytics = TCategory & {
  analytics: {
    totalSpent: number;
    totalTransactions: number;
    averageTransaction: number;
    lastTransactionDate?: string;
    monthlySpending: number;
    budgetUtilization?: number; // If has monthly budget limit
    trendDirection: 'up' | 'down' | 'stable';
  };
};

// Get categories with spending analytics
export async function getCategoriesWithAnalytics(filters?: {
  type?: 'income' | 'expense' | 'debt' | 'investment' | 'savings';
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<CategoryWithAnalytics[]> {
  const db = getDb();
  
  // Build category filter conditions
  const categoryConditions = [];
  if (filters?.type) {
    categoryConditions.push(eq(categoriesSchema.type, filters.type));
  }
  if (filters?.isActive !== undefined) {
    categoryConditions.push(eq(categoriesSchema.isActive, filters.isActive));
  }

  // Get categories
  const categories = await db
    .select()
    .from(categoriesSchema)
    .where(categoryConditions.length > 0 ? and(...categoryConditions) : undefined)
    .orderBy(categoriesSchema.name);

  // Calculate analytics for each category
  const categoriesWithAnalytics: CategoryWithAnalytics[] = [];
  
  for (const category of categories) {
    // Build transaction filter conditions
    const transactionConditions = [eq(transactionsSchema.categoryId, category.id)];
    
    if (filters?.dateFrom) {
      transactionConditions.push(gte(transactionsSchema.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      transactionConditions.push(lte(transactionsSchema.date, filters.dateTo));
    }

    // Get category spending analytics
    const [analytics] = await db
      .select({
        totalSpent: sql<number>`COALESCE(SUM(amount), 0)`,
        totalTransactions: sql<number>`COUNT(*)`,
        averageTransaction: sql<number>`COALESCE(AVG(amount), 0)`,
        lastTransactionDate: sql<string>`MAX(date)`,
      })
      .from(transactionsSchema)
      .where(and(...transactionConditions));

    // Get monthly spending (current month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [monthlySpending] = await db
      .select({
        amount: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.categoryId, category.id),
          sql`strftime('%Y-%m', date) = ${currentMonth}`
        )
      );

    // Calculate budget utilization if category has monthly budget limit
    let budgetUtilization: number | undefined;
    if (category.monthlyBudgetLimit && category.monthlyBudgetLimit > 0) {
      budgetUtilization = (monthlySpending.amount / category.monthlyBudgetLimit) * 100;
    }

    // Calculate trend (comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentSpending] = await db
      .select({
        amount: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.categoryId, category.id),
          gte(transactionsSchema.date, thirtyDaysAgo.toISOString().split('T')[0])
        )
      );

    const [previousSpending] = await db
      .select({
        amount: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.categoryId, category.id),
          gte(transactionsSchema.date, sixtyDaysAgo.toISOString().split('T')[0]),
          lte(transactionsSchema.date, thirtyDaysAgo.toISOString().split('T')[0])
        )
      );

    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (recentSpending.amount > previousSpending.amount * 1.1) {
      trendDirection = 'up';
    } else if (recentSpending.amount < previousSpending.amount * 0.9) {
      trendDirection = 'down';
    }

    categoriesWithAnalytics.push({
      ...category,
      analytics: {
        totalSpent: analytics.totalSpent,
        totalTransactions: analytics.totalTransactions,
        averageTransaction: analytics.averageTransaction,
        lastTransactionDate: analytics.lastTransactionDate || undefined,
        monthlySpending: monthlySpending.amount,
        budgetUtilization,
        trendDirection
      }
    });
  }

  return categoriesWithAnalytics;
}

// Get category spending summary
export async function getCategorySpendingSummary(filters?: {
  dateFrom?: string;
  dateTo?: string;
  type?: 'income' | 'expense' | 'debt' | 'investment' | 'savings';
}) {
  const db = getDb();
  
  const conditions = [];
  
  if (filters?.dateFrom) {
    conditions.push(gte(transactionsSchema.date, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(transactionsSchema.date, filters.dateTo));
  }
  if (filters?.type) {
    conditions.push(eq(categoriesSchema.type, filters.type));
  }

  const result = await db
    .select({
      categoryId: categoriesSchema.id,
      categoryName: categoriesSchema.name,
      categoryType: categoriesSchema.type,
      categoryColor: categoriesSchema.color,
      totalAmount: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`,
      transactionCount: sql<number>`COUNT(${transactionsSchema.id})`,
      averageAmount: sql<number>`COALESCE(AVG(${transactionsSchema.amount}), 0)`
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      categoriesSchema.id, 
      categoriesSchema.name, 
      categoriesSchema.type,
      categoriesSchema.color
    )
    .orderBy(desc(sql`SUM(${transactionsSchema.amount})`));

  return result;
}

// Get categories by type with filtering
export async function getCategoriesByType(type: 'income' | 'expense' | 'debt' | 'investment' | 'savings'): Promise<TCategory[]> {
  const db = getDb();
  
  return await db
    .select()
    .from(categoriesSchema)
    .where(
      and(
        eq(categoriesSchema.type, type),
        eq(categoriesSchema.isActive, true)
      )
    )
    .orderBy(categoriesSchema.name);
}

// Get active categories only
export async function getActiveCategories(): Promise<TCategory[]> {
  const db = getDb();
  
  return await db
    .select()
    .from(categoriesSchema)
    .where(eq(categoriesSchema.isActive, true))
    .orderBy(categoriesSchema.name);
}

// Get category usage statistics
export async function getCategoryUsageStats() {
  const db = getDb();
  
  const stats = await db
    .select({
      totalCategories: sql<number>`COUNT(*)`,
      activeCategories: sql<number>`COUNT(CASE WHEN is_active = 1 THEN 1 END)`,
      incomeCategories: sql<number>`COUNT(CASE WHEN type = 'income' THEN 1 END)`,
      expenseCategories: sql<number>`COUNT(CASE WHEN type = 'expense' THEN 1 END)`,
      categoriesWithBudgets: sql<number>`COUNT(CASE WHEN monthly_budget_limit IS NOT NULL AND monthly_budget_limit > 0 THEN 1 END)`
    })
    .from(categoriesSchema);
    
  return stats[0];
}

// Bulk update category status (activate/deactivate)
export async function bulkUpdateCategoryStatus(input: {
  ids: string[];
  isActive: boolean;
}): Promise<void> {
  const db = getDb();
  const ids = input.ids.map(id => parseInt(id));
  
  await db
    .update(categoriesSchema)
    .set({ isActive: input.isActive })
    .where(sql`${categoriesSchema.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    
  revalidatePath('/categories');
}
