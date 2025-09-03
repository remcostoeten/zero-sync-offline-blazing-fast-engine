'use server';

import { getDb } from '@/lib/database/connection';
import { 
  transactionsSchema, 
  categoriesSchema, 
  budgetsSchema, 
  savingsGoalsSchema,
  recurringTransactionsSchema 
} from '@/lib/database/schemas';
import { eq, desc, sql, and, gte, lte, sum, count, avg } from 'drizzle-orm';

// Report Types
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SpendingAnalysisReport {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageTransaction: number;
    dateRange: DateRange;
  };
  categoryBreakdown: {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    averageAmount: number;
  }[];
  monthlyTrends: {
    month: string;
    income: number;
    expenses: number;
    net: number;
  }[];
  topTransactions: {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    categoryName: string;
    date: string;
  }[];
}

export interface IncomeReport {
  summary: {
    totalIncome: number;
    averageMonthly: number;
    transactionCount: number;
    growthRate: number;
    dateRange: DateRange;
  };
  sources: {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    amount: number;
    percentage: number;
    frequency: number;
  }[];
  monthlyBreakdown: {
    month: string;
    amount: number;
    transactionCount: number;
  }[];
  recurringIncome: {
    name: string;
    amount: number;
    frequency: string;
    estimatedMonthly: number;
  }[];
}

export interface BudgetReport {
  summary: {
    totalBudgets: number;
    totalBudgetAmount: number;
    totalSpent: number;
    overBudgetCount: number;
    utilizationRate: number;
    dateRange: DateRange;
  };
  budgetPerformance: {
    budgetId: number;
    budgetName: string;
    categoryName: string;
    categoryColor: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentage: number;
    status: 'under' | 'near_limit' | 'over';
    alertThreshold: number;
  }[];
  categoryUtilization: {
    categoryName: string;
    categoryColor: string;
    budgetCount: number;
    totalBudget: number;
    totalSpent: number;
    averageUtilization: number;
  }[];
}

export interface SavingsReport {
  summary: {
    totalGoals: number;
    completedGoals: number;
    totalTarget: number;
    totalSaved: number;
    completionRate: number;
    averageProgress: number;
    dateRange: DateRange;
  };
  goalProgress: {
    goalId: number;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    percentage: number;
    targetDate?: string;
    daysRemaining?: number;
    monthlyTarget?: number;
    isOnTrack: boolean;
  }[];
  savingsTrends: {
    month: string;
    totalSaved: number;
    goalCount: number;
  }[];
}

export interface CashFlowReport {
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    averageDaily: number;
    dateRange: DateRange;
  };
  dailyFlow: {
    date: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
  weeklyFlow: {
    week: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
  monthlyFlow: {
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
}

// Generate spending analysis report
export async function generateSpendingAnalysisReport(dateRange: DateRange): Promise<SpendingAnalysisReport> {
  const db = getDb();
  const { startDate, endDate } = dateRange;

  // Summary statistics
  const [summary] = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
      averageTransaction: sql<number>`COALESCE(AVG(amount), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    );

  // Category breakdown (expenses only)
  const categoryBreakdown = await db
    .select({
      categoryId: categoriesSchema.id,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      amount: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`,
      transactionCount: sql<number>`COUNT(${transactionsSchema.id})`,
      averageAmount: sql<number>`COALESCE(AVG(${transactionsSchema.amount}), 0)`
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate),
        eq(transactionsSchema.type, 'expense')
      )
    )
    .groupBy(categoriesSchema.id, categoriesSchema.name, categoriesSchema.color)
    .orderBy(desc(sql`SUM(${transactionsSchema.amount})`));

  const totalExpenseAmount = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  // Monthly trends
  const monthlyTrends = await db
    .select({
      month: sql<string>`strftime('%Y-%m', date)`,
      income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    )
    .groupBy(sql`strftime('%Y-%m', date)`)
    .orderBy(sql`strftime('%Y-%m', date)`);

  // Top transactions
  const topTransactions = await db
    .select({
      id: transactionsSchema.id,
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      description: transactionsSchema.description,
      categoryName: categoriesSchema.name,
      date: transactionsSchema.date
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    )
    .orderBy(desc(transactionsSchema.amount))
    .limit(10);

  return {
    summary: {
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netIncome: summary.totalIncome - summary.totalExpenses,
      transactionCount: summary.transactionCount,
      averageTransaction: summary.averageTransaction,
      dateRange
    },
    categoryBreakdown: categoryBreakdown.map(item => ({
      categoryId: item.categoryId || 0,
      categoryName: item.categoryName || 'Uncategorized',
      categoryColor: item.categoryColor || '#gray',
      amount: item.amount,
      percentage: totalExpenseAmount > 0 ? (item.amount / totalExpenseAmount) * 100 : 0,
      transactionCount: item.transactionCount,
      averageAmount: item.averageAmount
    })),
    monthlyTrends: monthlyTrends.map(trend => ({
      month: trend.month,
      income: trend.income,
      expenses: trend.expenses,
      net: trend.income - trend.expenses
    })),
    topTransactions: topTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description || 'No description',
      categoryName: t.categoryName || 'Uncategorized',
      date: t.date
    }))
  };
}

// Generate income report
export async function generateIncomeReport(dateRange: DateRange): Promise<IncomeReport> {
  const db = getDb();
  const { startDate, endDate } = dateRange;

  // Summary statistics
  const [summary] = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(amount), 0)`,
      transactionCount: sql<number>`COUNT(*)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate),
        eq(transactionsSchema.type, 'income')
      )
    );

  // Calculate monthly average and growth
  const monthsInRange = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const averageMonthly = monthsInRange > 0 ? summary.totalIncome / monthsInRange : 0;

  // Income sources (categories)
  const sources = await db
    .select({
      categoryId: categoriesSchema.id,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      amount: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`,
      frequency: sql<number>`COUNT(${transactionsSchema.id})`
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate),
        eq(transactionsSchema.type, 'income')
      )
    )
    .groupBy(categoriesSchema.id, categoriesSchema.name, categoriesSchema.color)
    .orderBy(desc(sql`SUM(${transactionsSchema.amount})`));

  // Monthly breakdown
  const monthlyBreakdown = await db
    .select({
      month: sql<string>`strftime('%Y-%m', date)`,
      amount: sql<number>`COALESCE(SUM(amount), 0)`,
      transactionCount: sql<number>`COUNT(*)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate),
        eq(transactionsSchema.type, 'income')
      )
    )
    .groupBy(sql`strftime('%Y-%m', date)`)
    .orderBy(sql`strftime('%Y-%m', date)`);

  // Recurring income
  const recurringIncome = await db
    .select({
      name: recurringTransactionsSchema.name,
      amount: recurringTransactionsSchema.amount,
      frequency: recurringTransactionsSchema.frequency
    })
    .from(recurringTransactionsSchema)
    .where(
      and(
        eq(recurringTransactionsSchema.type, 'income'),
        eq(recurringTransactionsSchema.isActive, true)
      )
    );

  // Calculate growth rate (simplified)
  const growthRate = 0; // Would need more complex calculation

  return {
    summary: {
      totalIncome: summary.totalIncome,
      averageMonthly,
      transactionCount: summary.transactionCount,
      growthRate,
      dateRange
    },
    sources: sources.map(source => ({
      categoryId: source.categoryId || 0,
      categoryName: source.categoryName || 'Uncategorized',
      categoryColor: source.categoryColor || '#gray',
      amount: source.amount,
      percentage: summary.totalIncome > 0 ? (source.amount / summary.totalIncome) * 100 : 0,
      frequency: source.frequency
    })),
    monthlyBreakdown: monthlyBreakdown.map(month => ({
      month: month.month,
      amount: month.amount,
      transactionCount: month.transactionCount
    })),
    recurringIncome: recurringIncome.map(income => {
      let estimatedMonthly = 0;
      switch (income.frequency) {
        case 'daily':
          estimatedMonthly = income.amount * 30;
          break;
        case 'weekly':
          estimatedMonthly = income.amount * 4.33;
          break;
        case 'biweekly':
          estimatedMonthly = income.amount * 2.17;
          break;
        case 'monthly':
          estimatedMonthly = income.amount;
          break;
        case 'quarterly':
          estimatedMonthly = income.amount / 3;
          break;
        case 'yearly':
          estimatedMonthly = income.amount / 12;
          break;
      }

      return {
        name: income.name,
        amount: income.amount,
        frequency: income.frequency,
        estimatedMonthly
      };
    })
  };
}

// Generate budget performance report
export async function generateBudgetReport(dateRange: DateRange): Promise<BudgetReport> {
  const db = getDb();
  const { startDate, endDate } = dateRange;

  // Get all budgets
  const budgets = await db
    .select({
      budgetId: budgetsSchema.id,
      budgetName: budgetsSchema.name,
      budgetAmount: budgetsSchema.amount,
      alertThreshold: budgetsSchema.alertThreshold,
      categoryId: budgetsSchema.categoryId,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color
    })
    .from(budgetsSchema)
    .leftJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .where(eq(budgetsSchema.isActive, true));

  const budgetPerformance = [];
  let totalBudgetAmount = 0;
  let totalSpent = 0;
  let overBudgetCount = 0;

  for (const budget of budgets) {
    // Calculate spending for this budget's category in the date range
    const [spending] = await db
      .select({
        spent: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.categoryId, budget.categoryId),
          eq(transactionsSchema.type, 'expense'),
          gte(transactionsSchema.date, startDate),
          lte(transactionsSchema.date, endDate)
        )
      );

    const spentAmount = spending.spent;
    const remainingAmount = Math.max(0, budget.budgetAmount - spentAmount);
    const percentage = (spentAmount / budget.budgetAmount) * 100;
    const isOverBudget = spentAmount > budget.budgetAmount;
    const isNearLimit = percentage >= (budget.alertThreshold * 100);

    let status: 'under' | 'near_limit' | 'over';
    if (isOverBudget) {
      status = 'over';
      overBudgetCount++;
    } else if (isNearLimit) {
      status = 'near_limit';
    } else {
      status = 'under';
    }

    totalBudgetAmount += budget.budgetAmount;
    totalSpent += spentAmount;

    budgetPerformance.push({
      budgetId: budget.budgetId,
      budgetName: budget.budgetName,
      categoryName: budget.categoryName || 'Unknown',
      categoryColor: budget.categoryColor || '#gray',
      budgetAmount: budget.budgetAmount,
      spentAmount,
      remainingAmount,
      percentage,
      status,
      alertThreshold: budget.alertThreshold
    });
  }

  // Category utilization summary
  const categoryUtilization = await db
    .select({
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      budgetCount: sql<number>`COUNT(${budgetsSchema.id})`,
      totalBudget: sql<number>`COALESCE(SUM(${budgetsSchema.amount}), 0)`,
      categoryId: categoriesSchema.id
    })
    .from(budgetsSchema)
    .leftJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .where(eq(budgetsSchema.isActive, true))
    .groupBy(categoriesSchema.id, categoriesSchema.name, categoriesSchema.color);

  const categoryUtilizationWithSpending = [];
  for (const category of categoryUtilization) {
    const [spending] = await db
      .select({
        spent: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.categoryId, category.categoryId),
          eq(transactionsSchema.type, 'expense'),
          gte(transactionsSchema.date, startDate),
          lte(transactionsSchema.date, endDate)
        )
      );

    const averageUtilization = category.totalBudget > 0 
      ? (spending.spent / category.totalBudget) * 100 
      : 0;

    categoryUtilizationWithSpending.push({
      categoryName: category.categoryName || 'Unknown',
      categoryColor: category.categoryColor || '#gray',
      budgetCount: category.budgetCount,
      totalBudget: category.totalBudget,
      totalSpent: spending.spent,
      averageUtilization
    });
  }

  return {
    summary: {
      totalBudgets: budgets.length,
      totalBudgetAmount,
      totalSpent,
      overBudgetCount,
      utilizationRate: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0,
      dateRange
    },
    budgetPerformance: budgetPerformance.sort((a, b) => b.percentage - a.percentage),
    categoryUtilization: categoryUtilizationWithSpending.sort((a, b) => b.averageUtilization - a.averageUtilization)
  };
}

// Generate cash flow report
export async function generateCashFlowReport(dateRange: DateRange): Promise<CashFlowReport> {
  const db = getDb();
  const { startDate, endDate } = dateRange;

  // Summary
  const [summary] = await db
    .select({
      totalInflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      totalOutflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    );

  const netCashFlow = summary.totalInflow - summary.totalOutflow;
  const daysInRange = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const averageDaily = daysInRange > 0 ? netCashFlow / daysInRange : 0;

  // Daily cash flow
  const dailyFlow = await db
    .select({
      date: transactionsSchema.date,
      inflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      outflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    )
    .groupBy(transactionsSchema.date)
    .orderBy(transactionsSchema.date);

  // Weekly cash flow
  const weeklyFlow = await db
    .select({
      week: sql<string>`strftime('%Y-W%W', date)`,
      inflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      outflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    )
    .groupBy(sql`strftime('%Y-W%W', date)`)
    .orderBy(sql`strftime('%Y-W%W', date)`);

  // Monthly cash flow
  const monthlyFlow = await db
    .select({
      month: sql<string>`strftime('%Y-%m', date)`,
      inflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      outflow: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`
    })
    .from(transactionsSchema)
    .where(
      and(
        gte(transactionsSchema.date, startDate),
        lte(transactionsSchema.date, endDate)
      )
    )
    .groupBy(sql`strftime('%Y-%m', date)`)
    .orderBy(sql`strftime('%Y-%m', date)`);

  return {
    summary: {
      totalInflow: summary.totalInflow,
      totalOutflow: summary.totalOutflow,
      netCashFlow,
      averageDaily,
      dateRange
    },
    dailyFlow: dailyFlow.map(day => ({
      date: day.date,
      inflow: day.inflow,
      outflow: day.outflow,
      net: day.inflow - day.outflow
    })),
    weeklyFlow: weeklyFlow.map(week => ({
      week: week.week,
      inflow: week.inflow,
      outflow: week.outflow,
      net: week.inflow - week.outflow
    })),
    monthlyFlow: monthlyFlow.map(month => ({
      month: month.month,
      inflow: month.inflow,
      outflow: month.outflow,
      net: month.inflow - month.outflow
    }))
  };
}
