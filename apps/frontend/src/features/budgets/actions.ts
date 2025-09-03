'use server';

import { getDb } from '@/lib/database/connection';
import { budgetsSchema, categoriesSchema, transactionsSchema, TBudget, TCategory } from '@/lib/database/schemas';
import { createBudgetSchema, updateBudgetSchema } from '@/lib/validation/schemas';
import { eq, desc, and, gte, lte, sql, between } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// Extended budget type with comprehensive spending info and category details
export type BudgetWithProgress = TBudget & {
  category: TCategory;
  progress: {
    percentage: number;
    remaining: number;
    totalBudget: number; // budget amount + carryover
    isOverBudget: boolean;
    daysLeft?: number;
    averageSpendingPerDay?: number;
    projectedSpending?: number;
    alertTriggered: boolean;
    healthStatus: 'healthy' | 'warning' | 'danger' | 'over-budget';
  };
};

// Budget period utility functions
function calculatePeriodDates(budget: TBudget) {
  const startDate = new Date(budget.startDate);
  const currentDate = new Date();
  let periodStart = new Date(startDate);
  let periodEnd: Date;

  switch (budget.period) {
    case 'weekly':
      // Find the current week period
      const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksSinceStart = Math.floor(daysSinceStart / 7);
      periodStart = new Date(startDate);
      periodStart.setDate(startDate.getDate() + (weeksSinceStart * 7));
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      break;
      
    case 'monthly':
      periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), budget.resetDay || 1);
      if (periodStart > currentDate) {
        periodStart.setMonth(periodStart.getMonth() - 1);
      }
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);
      break;
      
    case 'quarterly':
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      periodStart = new Date(currentDate.getFullYear(), currentQuarter * 3, budget.resetDay || 1);
      if (periodStart > currentDate) {
        periodStart.setMonth(periodStart.getMonth() - 3);
      }
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
      break;
      
    case 'yearly':
      periodStart = new Date(currentDate.getFullYear(), 0, budget.resetDay || 1);
      if (periodStart > currentDate) {
        periodStart.setFullYear(periodStart.getFullYear() - 1);
      }
      periodEnd = new Date(periodStart.getFullYear(), 11, 31);
      break;
      
    default:
      periodEnd = budget.endDate ? new Date(budget.endDate) : new Date();
  }

  return { periodStart, periodEnd };
}

// Calculate spending for a budget in the current period
async function calculateBudgetSpending(budget: TBudget): Promise<number> {
  const db = getDb();
  const { periodStart, periodEnd } = calculatePeriodDates(budget);
  
  const result = await db
    .select({
      totalSpent: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        eq(transactionsSchema.categoryId, budget.categoryId),
        eq(transactionsSchema.type, 'expense'),
        between(transactionsSchema.date, 
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0]
        )
      )
    );

  return result[0]?.totalSpent || 0;
}

// Calculate progress and health metrics
async function calculateProgress(budget: TBudget, category: TCategory): Promise<BudgetWithProgress['progress']> {
  const currentSpending = await calculateBudgetSpending(budget);
  const totalBudget = budget.amount + (budget.carryoverAmount || 0);
  const percentage = totalBudget > 0 ? (currentSpending / totalBudget) * 100 : 0;
  const remaining = Math.max(0, totalBudget - currentSpending);
  const isOverBudget = currentSpending > totalBudget;
  const alertTriggered = percentage >= ((budget.alertThreshold || 0.8) * 100);
  
  // Calculate days left in current period
  const { periodEnd } = calculatePeriodDates(budget);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate average spending and projections
  const { periodStart } = calculatePeriodDates(budget);
  const daysElapsed = Math.max(1, Math.ceil((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
  const averageSpendingPerDay = currentSpending / daysElapsed;
  const totalPeriodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const projectedSpending = averageSpendingPerDay * totalPeriodDays;
  
  // Determine health status
  let healthStatus: 'healthy' | 'warning' | 'danger' | 'over-budget';
  if (isOverBudget) {
    healthStatus = 'over-budget';
  } else if (percentage >= 90) {
    healthStatus = 'danger';
  } else if (percentage >= ((budget.alertThreshold || 0.8) * 100)) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'healthy';
  }

  return {
    percentage: Math.min(percentage, 100),
    remaining,
    totalBudget,
    isOverBudget,
    daysLeft: daysLeft > 0 ? daysLeft : undefined,
    averageSpendingPerDay,
    projectedSpending,
    alertTriggered,
    healthStatus
  };
}

// Create a new budget
export async function createBudget(input: CreateBudgetInput): Promise<TBudget> {
  const validatedData = createBudgetSchema.parse(input);
  const db = getDb();
  
  // Verify category exists
  const category = await db
    .select()
    .from(categoriesSchema)
    .where(eq(categoriesSchema.id, validatedData.categoryId))
    .limit(1);
    
  if (category.length === 0) {
    throw new Error('Category not found');
  }
  
  const result = await db
    .insert(budgetsSchema)
    .values({
      ...validatedData,
      alertThreshold: validatedData.alertThreshold || 0.8,
    })
    .returning();
    
  revalidatePath('/budgets');
  
  return result[0];
}

// Get all budgets with progress calculations and category info
export async function getBudgets(filters?: {
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
  categoryId?: number;
  priority?: 'low' | 'medium' | 'high';
  healthStatus?: 'healthy' | 'warning' | 'danger' | 'over-budget';
}): Promise<BudgetWithProgress[]> {
  const db = getDb();
  
  const budgetsWithCategories = await db
    .select({
      budget: budgetsSchema,
      category: categoriesSchema,
    })
    .from(budgetsSchema)
    .innerJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .orderBy(desc(budgetsSchema.priority), desc(budgetsSchema.createdAt));
    
  // Calculate progress for each budget
  const budgetsWithProgress = await Promise.all(
    budgetsWithCategories.map(async ({ budget, category }) => {
      const progress = await calculateProgress(budget, category);
      return {
        ...budget,
        category,
        progress
      } as BudgetWithProgress;
    })
  );
  
  // Apply filters
  const filteredBudgets = budgetsWithProgress.filter(budget => {
    if (filters?.period && budget.period !== filters.period) return false;
    if (filters?.isActive !== undefined && budget.isActive !== filters.isActive) return false;
    if (filters?.categoryId && budget.categoryId !== filters.categoryId) return false;
    if (filters?.priority && budget.priority !== filters.priority) return false;
    if (filters?.healthStatus && budget.progress.healthStatus !== filters.healthStatus) return false;
    return true;
  });
  
  return filteredBudgets;
}

// Get budget by ID with progress
export async function getBudgetById(id: number): Promise<BudgetWithProgress | null> {
  const db = getDb();
  
  const result = await db
    .select({
      budget: budgetsSchema,
      category: categoriesSchema,
    })
    .from(budgetsSchema)
    .innerJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .where(eq(budgetsSchema.id, id))
    .limit(1);
    
  if (!result[0]) return null;
  
  const { budget, category } = result[0];
  const progress = await calculateProgress(budget, category);
  
  return {
    ...budget,
    category,
    progress
  } as BudgetWithProgress;
}

// Update a budget
export async function updateBudget(input: UpdateBudgetInput): Promise<TBudget> {
  const validatedData = updateBudgetSchema.parse(input);
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
    .update(budgetsSchema)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(budgetsSchema.id, parseInt(id!)))
    .returning();
    
  revalidatePath('/budgets');
  
  return result[0];
}

// Delete a budget
export async function deleteBudget(input: { id: string }): Promise<void> {
  const db = getDb();
  
  await db
    .delete(budgetsSchema)
    .where(eq(budgetsSchema.id, parseInt(input.id)));
    
  revalidatePath('/budgets');
}

// Refresh budget spending from transactions (recalculate spent amount)
export async function refreshBudgetSpending(input: { id: string }): Promise<TBudget> {
  const db = getDb();
  const budgetId = parseInt(input.id);
  
  // Get the budget
  const [budget] = await db
    .select()
    .from(budgetsSchema)
    .where(eq(budgetsSchema.id, budgetId))
    .limit(1);
    
  if (!budget) {
    throw new Error('Budget not found');
  }
  
  // Calculate current spending
  const currentSpending = await calculateBudgetSpending(budget);
  
  // Update the spent amount
  const result = await db
    .update(budgetsSchema)
    .set({
      spent: currentSpending,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(budgetsSchema.id, budgetId))
    .returning();
    
  revalidatePath('/budgets');
  
  return result[0];
}

// Get budgets summary
export async function getBudgetsSummary() {
  const db = getDb();
  
  const [summary] = await db
    .select({
      totalBudgets: sql<number>`COUNT(*)`,
      activeBudgets: sql<number>`COUNT(CASE WHEN is_active = 1 THEN 1 END)`,
      totalBudgetAmount: sql<number>`COALESCE(SUM(CASE WHEN is_active = 1 THEN amount ELSE 0 END), 0)`,
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN is_active = 1 THEN spent ELSE 0 END), 0)`,
      totalRemaining: sql<number>`COALESCE(SUM(CASE WHEN is_active = 1 THEN (amount - spent) ELSE 0 END), 0)`
    })
    .from(budgetsSchema);
    
  return summary;
}

// Get budget alerts (over-budget, approaching limit, etc.)
export async function getBudgetAlerts(): Promise<{
  overBudget: BudgetWithProgress[];
  nearLimit: BudgetWithProgress[];
  healthyBudgets: BudgetWithProgress[];
}> {
  const budgets = await getBudgets({ isActive: true });
  
  const overBudget = budgets.filter(b => b.progress.isOverBudget);
  const nearLimit = budgets.filter(b => 
    !b.progress.isOverBudget && 
    b.progress.alertTriggered && 
    b.progress.percentage >= 80
  );
  const healthyBudgets = budgets.filter(b => b.progress.healthStatus === 'healthy');
  
  return { overBudget, nearLimit, healthyBudgets };
}

// Get spending trends and insights
export async function getBudgetInsights(): Promise<{
  totalCategories: number;
  averageSpendingRate: number;
  mostOverspentCategory?: { categoryName: string; overspent: number };
  bestPerformingBudget?: { budgetName: string; remaining: number };
  periodComparison: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}> {
  const budgets = await getBudgets({ isActive: true });
  const db = getDb();
  
  // Get spending for period comparison
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  
  const [periodSpending] = await db
    .select({
      thisWeek: sql<number>`COALESCE(SUM(CASE WHEN date >= ${thisWeekStart.toISOString().split('T')[0]} THEN amount ELSE 0 END), 0)`,
      lastWeek: sql<number>`COALESCE(SUM(CASE WHEN date >= ${lastWeekStart.toISOString().split('T')[0]} AND date <= ${lastWeekEnd.toISOString().split('T')[0]} THEN amount ELSE 0 END), 0)`,
      thisMonth: sql<number>`COALESCE(SUM(CASE WHEN date >= ${thisMonthStart.toISOString().split('T')[0]} THEN amount ELSE 0 END), 0)`,
      lastMonth: sql<number>`COALESCE(SUM(CASE WHEN date >= ${lastMonthStart.toISOString().split('T')[0]} AND date <= ${lastMonthEnd.toISOString().split('T')[0]} THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(eq(transactionsSchema.type, 'expense'));
  
  // Calculate insights
  const totalCategories = new Set(budgets.map(b => b.categoryId)).size;
  const averageSpendingRate = budgets.length > 0 
    ? budgets.reduce((sum, b) => sum + b.progress.percentage, 0) / budgets.length 
    : 0;
    
  const mostOverspent = budgets
    .filter(b => b.progress.isOverBudget)
    .sort((a, b) => {
      const aOverspent = (a.spent || 0) - a.progress.totalBudget;
      const bOverspent = (b.spent || 0) - b.progress.totalBudget;
      return bOverspent - aOverspent;
    })[0];
    
  const bestPerforming = budgets
    .filter(b => !b.progress.isOverBudget)
    .sort((a, b) => b.progress.remaining - a.progress.remaining)[0];
  
  return {
    totalCategories,
    averageSpendingRate,
    mostOverspentCategory: mostOverspent ? {
      categoryName: mostOverspent.category.name,
      overspent: (mostOverspent.spent || 0) - mostOverspent.progress.totalBudget
    } : undefined,
    bestPerformingBudget: bestPerforming ? {
      budgetName: bestPerforming.name,
      remaining: bestPerforming.progress.remaining
    } : undefined,
    periodComparison: periodSpending
  };
}

// Auto-renew budgets for new periods
export async function autoRenewBudgets(): Promise<{ renewed: number; errors: string[] }> {
  const db = getDb();
  const errors: string[] = [];
  let renewed = 0;
  
  try {
    const budgetsToRenew = await db
      .select()
      .from(budgetsSchema)
      .where(
        and(
          eq(budgetsSchema.isActive, true),
          eq(budgetsSchema.autoRenew || false, true)
        )
      );
    
    for (const budget of budgetsToRenew) {
      try {
        const { periodEnd } = calculatePeriodDates(budget);
        const today = new Date();
        
        // If period has ended, create new budget for next period
        if (today > periodEnd) {
          const carryover = budget.rollover 
            ? Math.max(0, budget.amount - (budget.spent || 0)) 
            : 0;
            
          const newStartDate = new Date(periodEnd);
          newStartDate.setDate(newStartDate.getDate() + 1);
          
          await db.insert(budgetsSchema).values({
            categoryId: budget.categoryId,
            name: budget.name,
            description: budget.description,
            amount: budget.amount,
            spent: 0,
            period: budget.period,
            startDate: newStartDate.toISOString().split('T')[0],
            isActive: true,
            alertThreshold: budget.alertThreshold,
            rollover: budget.rollover,
            carryoverAmount: carryover,
            color: budget.color,
            priority: budget.priority,
            autoRenew: budget.autoRenew,
            resetDay: budget.resetDay,
          });
          
          renewed++;
        }
      } catch (error) {
        errors.push(`Failed to renew budget ${budget.name}: ${error}`);
      }
    }
    
    revalidatePath('/budgets');
    
    return { renewed, errors };
  } catch (error) {
    errors.push(`Auto-renewal process failed: ${error}`);
    return { renewed, errors };
  }
}

// Get categories available for budgeting (expense categories)
export async function getBudgetCategories(): Promise<TCategory[]> {
  const db = getDb();
  
  const categories = await db
    .select()
    .from(categoriesSchema)
    .where(
      and(
        eq(categoriesSchema.type, 'expense'),
        eq(categoriesSchema.isActive, true)
      )
    )
    .orderBy(categoriesSchema.name);
    
  return categories;
}
