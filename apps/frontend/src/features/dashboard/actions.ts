'use server';

import { getDb } from '@/lib/database/connection';
import { 
  transactionsSchema, 
  categoriesSchema, 
  budgetsSchema, 
  savingsGoalsSchema,
  recurringTransactionsSchema 
} from '@/lib/database/schemas';
import { eq, desc, sql, and, gte, lte, sum } from 'drizzle-orm';

// Dashboard Overview Types
export interface DashboardOverview {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  totalSavings: number;
  activeBudgets: number;
  overdueTransactions: number;
  savingsGoalsProgress: number;
}

export interface RecentTransaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  categoryName: string;
  categoryColor: string;
}

export interface SpendingTrend {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface BudgetProgress {
  budgetId: number;
  budgetName: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  isOverBudget: boolean;
  alertThreshold: number;
}

export interface SavingsProgress {
  goalId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  targetDate?: string;
  isCompleted: boolean;
  monthlyTarget?: number;
}

// Get comprehensive dashboard overview
export async function getDashboardOverview(dateFilter?: {
  startDate?: string;
  endDate?: string;
}): Promise<DashboardOverview> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // Calculate date range
  const startDate = dateFilter?.startDate || `${currentMonth}-01`;
  const endDate = dateFilter?.endDate || new Date().toISOString().split('T')[0];

  // Get monthly income and expenses
  const [monthlyStats] = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(*)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    );

  // Get total balance (all time)
  const [balanceStats] = await db
    .select({
      totalBalance: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)`
    })
    .from(transactionsSchema);

  // Get savings goals progress
  const [savingsStats] = await db
    .select({
      totalSavings: sql<number>`COALESCE(SUM(current_amount), 0)`,
      completedGoals: sql<number>`COUNT(CASE WHEN is_completed = 1 THEN 1 END)`,
      totalGoals: sql<number>`COUNT(*)`
    })
    .from(savingsGoalsSchema)
    .where(eq(savingsGoalsSchema.isActive, true));

  // Get active budgets count
  const [budgetStats] = await db
    .select({
      activeBudgets: sql<number>`COUNT(*)`
    })
    .from(budgetsSchema)
    .where(eq(budgetsSchema.isActive, true));

  // Get overdue recurring transactions (simplified for now)
  const [overdueStats] = await db
    .select({
      overdueCount: sql<number>`COUNT(*)`
    })
    .from(recurringTransactionsSchema)
    .where(
      and(
        eq(recurringTransactionsSchema.isActive, true),
        eq(recurringTransactionsSchema.autoGenerate, true)
      )
    );

  const netCashFlow = monthlyStats.totalIncome - monthlyStats.totalExpenses;
  const savingsProgress = savingsStats.totalGoals > 0 ? (savingsStats.completedGoals / savingsStats.totalGoals) * 100 : 0;

  return {
    totalBalance: balanceStats.totalBalance,
    monthlyIncome: monthlyStats.totalIncome,
    monthlyExpenses: monthlyStats.totalExpenses,
    netCashFlow,
    totalSavings: savingsStats.totalSavings,
    activeBudgets: budgetStats.activeBudgets,
    overdueTransactions: overdueStats.overdueCount,
    savingsGoalsProgress: savingsProgress
  };
}

// Get recent transactions for dashboard
export async function getRecentTransactions(limit: number = 10): Promise<RecentTransaction[]> {
  const db = getDb();
  
  const transactions = await db
    .select({
      id: transactionsSchema.id,
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      description: transactionsSchema.description,
      date: transactionsSchema.date,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .orderBy(desc(transactionsSchema.createdAt))
    .limit(limit);

  return transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    description: t.description || 'No description',
    date: t.date,
    categoryName: t.categoryName || 'Uncategorized',
    categoryColor: t.categoryColor || '#gray'
  }));
}

// Get spending trends for chart
export async function getSpendingTrends(days: number = 30): Promise<SpendingTrend[]> {
  const db = getDb();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const trends = await db
    .select({
      date: transactionsSchema.date,
      income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate.toISOString().split('T')[0]),
        lte(transactionsSchema.date, endDate.toISOString().split('T')[0])
      )
    )
    .groupBy(transactionsSchema.date)
    .orderBy(transactionsSchema.date);

  return trends.map(trend => ({
    date: trend.date,
    income: trend.income,
    expenses: trend.expenses,
    net: trend.income - trend.expenses
  }));
}

// Get category breakdown for current month
export async function getCategoryBreakdown(type?: 'income' | 'expense'): Promise<CategoryBreakdown[]> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const conditions = [
    sql`strftime('%Y-%m', ${transactionsSchema.date}) = ${currentMonth}`
  ];
  
  if (type) {
    conditions.push(eq(transactionsSchema.type, type));
  }

  const breakdown = await db
    .select({
      categoryId: categoriesSchema.id,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      amount: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`,
      transactionCount: sql<number>`COUNT(${transactionsSchema.id})`
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(and(...conditions))
    .groupBy(categoriesSchema.id, categoriesSchema.name, categoriesSchema.color)
    .orderBy(desc(sql`SUM(${transactionsSchema.amount})`));

  const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return breakdown.map(item => ({
    categoryId: item.categoryId || 0,
    categoryName: item.categoryName || 'Uncategorized',
    categoryColor: item.categoryColor || '#gray',
    amount: item.amount,
    percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    transactionCount: item.transactionCount
  }));
}

// Get budget progress for dashboard
export async function getBudgetProgress(): Promise<BudgetProgress[]> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get budgets with current spending
  const budgets = await db
    .select({
      budgetId: budgetsSchema.id,
      budgetName: budgetsSchema.name,
      budgetAmount: budgetsSchema.amount,
      alertThreshold: budgetsSchema.alertThreshold,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      categoryId: budgetsSchema.categoryId
    })
    .from(budgetsSchema)
    .leftJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .where(eq(budgetsSchema.isActive, true));

  const budgetProgress: BudgetProgress[] = [];

  for (const budget of budgets) {
    // Calculate current spending for this budget's category
    const [spending] = await db
      .select({
        spent: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.categoryId, budget.categoryId),
          eq(transactionsSchema.type, 'expense'),
          sql`strftime('%Y-%m', ${transactionsSchema.date}) = ${currentMonth}`
        )
      );

    const spentAmount = spending.spent;
    const remainingAmount = Math.max(0, budget.budgetAmount - spentAmount);
    const percentage = (spentAmount / budget.budgetAmount) * 100;
    const isOverBudget = spentAmount > budget.budgetAmount;

    budgetProgress.push({
      budgetId: budget.budgetId,
      budgetName: budget.budgetName,
      categoryName: budget.categoryName || 'Unknown',
      categoryColor: budget.categoryColor || '#gray',
      budgetAmount: budget.budgetAmount,
      spentAmount,
      remainingAmount,
      percentage,
      isOverBudget,
      alertThreshold: budget.alertThreshold
    });
  }

  return budgetProgress.sort((a, b) => b.percentage - a.percentage);
}

// Get savings goals progress
export async function getSavingsProgress(): Promise<SavingsProgress[]> {
  const db = getDb();

  const goals = await db
    .select()
    .from(savingsGoalsSchema)
    .where(eq(savingsGoalsSchema.isActive, true))
    .orderBy(desc(savingsGoalsSchema.priority), savingsGoalsSchema.targetDate);

  return goals.map(goal => {
    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount,
      percentage,
      targetDate: goal.targetDate || undefined,
      isCompleted: goal.isCompleted,
      monthlyTarget: goal.monthlyTarget || undefined
    };
  });
}

// Get quick financial insights
export async function getFinancialInsights(): Promise<{
  topSpendingCategory: string;
  averageDailySpending: number;
  savingsRate: number;
  budgetAlerts: number;
  recurringTransactionsValue: number;
}> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get top spending category this month
  const [topCategory] = await db
    .select({
      categoryName: categoriesSchema.name,
      totalSpent: sql<number>`SUM(${transactionsSchema.amount})`
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(
      and(
        eq(transactionsSchema.type, 'expense'),
        sql`strftime('%Y-%m', ${transactionsSchema.date}) = ${currentMonth}`
      )
    )
    .groupBy(categoriesSchema.id, categoriesSchema.name)
    .orderBy(desc(sql`SUM(${transactionsSchema.amount})`))
    .limit(1);

  // Get monthly totals
  const [monthlyTotals] = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
      dayCount: sql<number>`COUNT(DISTINCT date)`
    })
    .from(transactionsSchema)
    .where(sql`strftime('%Y-%m', ${transactionsSchema.date}) = ${currentMonth}`);

  // Get budget alerts (budgets over threshold)
  const budgetProgress = await getBudgetProgress();
  const budgetAlerts = budgetProgress.filter(b => 
    b.percentage >= (b.alertThreshold * 100) || b.isOverBudget
  ).length;

  // Get recurring transactions monthly value
  const [recurringValue] = await db
    .select({
      monthlyValue: sql<number>`COALESCE(SUM(CASE WHEN frequency = 'monthly' THEN amount ELSE 0 END), 0)`
    })
    .from(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.isActive, true));

  const averageDailySpending = monthlyTotals.dayCount > 0 ? 
    monthlyTotals.totalExpenses / monthlyTotals.dayCount : 0;
  
  const savingsRate = monthlyTotals.totalIncome > 0 ? 
    ((monthlyTotals.totalIncome - monthlyTotals.totalExpenses) / monthlyTotals.totalIncome) * 100 : 0;

  return {
    topSpendingCategory: topCategory?.categoryName || 'No spending yet',
    averageDailySpending,
    savingsRate,
    budgetAlerts,
    recurringTransactionsValue: recurringValue.monthlyValue
  };
}
