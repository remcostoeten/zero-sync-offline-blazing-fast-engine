import { createCrudFactory, createDb } from '../../../../shared';
import { 
  budgetsSchema, 
  transactionsSchema,
  categoriesSchema,
  TBudget, 
  TBudgetInsert, 
  TBudgetSelect
} from '../../../../shared/schemas';
import { eq, and, gte, lte, desc, asc, sum, sql, inArray } from 'drizzle-orm';

const budgetCrud = createCrudFactory<typeof budgetsSchema, TBudgetInsert, TBudgetSelect>(budgetsSchema)();

type TBudgetsFilters = {
  categoryId?: number;
  period?: 'monthly' | 'yearly' | 'all';
  status?: 'active' | 'exceeded' | 'completed' | 'all';
  includeInactive?: boolean;
  sortBy?: 'amount' | 'spent' | 'remaining' | 'percentage' | 'categoryName' | 'startDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

type TBudgetWithUtilization = TBudget & {
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'on_track' | 'warning' | 'exceeded' | 'completed';
  daysRemaining?: number;
  isActive: boolean;
};

type TBudgetUtilizationFilters = {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  alertThreshold?: number;
};

type TBudgetAlert = {
  budgetId: number;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
  alertLevel: 'warning' | 'critical' | 'exceeded';
  message: string;
};

async function calculateBudgetUtilization(budgetId: number, startDate?: string, endDate?: string) {
  const db = createDb();
  
  // Get budget details
  const budget = await db
    .select()
    .from(budgetsSchema)
    .where(eq(budgetsSchema.id, budgetId))
    .limit(1);
    
  if (!budget[0]) {
    throw new Error('Budget not found');
  }
  
  const budgetData = budget[0];
  const effectiveStartDate = startDate || budgetData.startDate;
  const effectiveEndDate = endDate || budgetData.endDate || new Date().toISOString().split('T')[0];
  
  // Calculate spent amount from transactions
  const result = await db
    .select({
      totalSpent: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`
    })
    .from(transactionsSchema)
    .where(and(
      eq(transactionsSchema.categoryId, budgetData.categoryId),
      eq(transactionsSchema.type, 'expense'),
      gte(transactionsSchema.date, effectiveStartDate),
      lte(transactionsSchema.date, effectiveEndDate)
    ));
  
  const spentAmount = result[0]?.totalSpent || 0;
  const remainingAmount = Math.max(0, budgetData.amount - spentAmount);
  const percentageUsed = budgetData.amount > 0 ? (spentAmount / budgetData.amount) * 100 : 0;
  
  // Calculate days remaining
  let daysRemaining;
  if (budgetData.endDate) {
    const endDate = new Date(budgetData.endDate);
    const today = new Date();
    daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine status
  let status: 'on_track' | 'warning' | 'exceeded' | 'completed';
  if (percentageUsed >= 100) {
    status = 'exceeded';
  } else if (percentageUsed >= 80) {
    status = 'warning';
  } else if (daysRemaining !== undefined && daysRemaining <= 0) {
    status = 'completed';
  } else {
    status = 'on_track';
  }
  
  return {
    spentAmount,
    remainingAmount,
    percentageUsed: Math.min(percentageUsed, 999), // Cap at 999% for display
    status,
    daysRemaining
  };
}

async function getBudgets(filters: TBudgetsFilters = {}): Promise<TBudgetWithUtilization[]> {
  const db = createDb();
  
  // Base query with category joins
  let query = db
    .select({
      id: budgetsSchema.id,
      categoryId: budgetsSchema.categoryId,
      amount: budgetsSchema.amount,
      period: budgetsSchema.period,
      startDate: budgetsSchema.startDate,
      endDate: budgetsSchema.endDate,
      isActive: budgetsSchema.isActive,
      createdAt: budgetsSchema.createdAt,
      updatedAt: budgetsSchema.updatedAt,
      synced: budgetsSchema.synced,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      categoryIcon: categoriesSchema.icon
    })
    .from(budgetsSchema)
    .innerJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id));

  // Apply filters
  const conditions = [];
  
  if (filters.categoryId) {
    conditions.push(eq(budgetsSchema.categoryId, filters.categoryId));
  }
  
  if (filters.period && filters.period !== 'all') {
    conditions.push(eq(budgetsSchema.period, filters.period));
  }
  
  if (!filters.includeInactive) {
    conditions.push(eq(budgetsSchema.isActive, true));
  }

  // Execute query with conditions
  const budgets = conditions.length > 0 
    ? await query
        .where(and(...conditions))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
    : await query
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

  // Calculate utilization for each budget
  const budgetsWithUtilization: TBudgetWithUtilization[] = [];
  
  for (const budget of budgets) {
    const utilization = await calculateBudgetUtilization(budget.id);
    
    const budgetWithUtilization: TBudgetWithUtilization = {
      ...budget,
      spentAmount: utilization.spentAmount,
      remainingAmount: utilization.remainingAmount,
      percentageUsed: utilization.percentageUsed,
      status: utilization.status,
      daysRemaining: utilization.daysRemaining
    };
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status !== utilization.status) {
        continue;
      }
    }
    
    budgetsWithUtilization.push(budgetWithUtilization);
  }
  
  // Sort results
  if (filters.sortBy) {
    budgetsWithUtilization.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case 'spent':
          aVal = a.spentAmount;
          bVal = b.spentAmount;
          break;
        case 'remaining':
          aVal = a.remainingAmount;
          bVal = b.remainingAmount;
          break;
        case 'percentage':
          aVal = a.percentageUsed;
          bVal = b.percentageUsed;
          break;
        case 'categoryName':
          aVal = a.categoryName;
          bVal = b.categoryName;
          break;
        case 'startDate':
          aVal = a.startDate;
          bVal = b.startDate;
          break;
        default:
          aVal = a.amount;
          bVal = b.amount;
      }
      
      if (filters.sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  }
  
  return budgetsWithUtilization;
}

async function getBudgetById(id: number): Promise<TBudgetWithUtilization | null> {
  const db = createDb();
  
  const budget = await db
    .select({
      id: budgetsSchema.id,
      categoryId: budgetsSchema.categoryId,
      amount: budgetsSchema.amount,
      period: budgetsSchema.period,
      startDate: budgetsSchema.startDate,
      endDate: budgetsSchema.endDate,
      isActive: budgetsSchema.isActive,
      createdAt: budgetsSchema.createdAt,
      updatedAt: budgetsSchema.updatedAt,
      synced: budgetsSchema.synced,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      categoryIcon: categoriesSchema.icon
    })
    .from(budgetsSchema)
    .innerJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .where(eq(budgetsSchema.id, id))
    .limit(1);
    
  if (!budget[0]) {
    return null;
  }
  
  const utilization = await calculateBudgetUtilization(id);
  
  return {
    ...budget[0],
    spentAmount: utilization.spentAmount,
    remainingAmount: utilization.remainingAmount,
    percentageUsed: utilization.percentageUsed,
    status: utilization.status,
    daysRemaining: utilization.daysRemaining
  };
}

async function getBudgetUtilization(filters: TBudgetUtilizationFilters = {}) {
  const budgets = await getBudgets({ includeInactive: false });
  
  const utilizationData = [];
  const alerts: TBudgetAlert[] = [];
  
  for (const budget of budgets) {
    // Apply category filter if specified
    if (filters.categoryIds && !filters.categoryIds.includes(budget.categoryId)) {
      continue;
    }
    
    // Recalculate with custom date range if provided
    let utilization;
    if (filters.startDate || filters.endDate) {
      utilization = await calculateBudgetUtilization(budget.id, filters.startDate, filters.endDate);
    } else {
      utilization = {
        spentAmount: budget.spentAmount,
        remainingAmount: budget.remainingAmount,
        percentageUsed: budget.percentageUsed,
        status: budget.status
      };
    }
    
    utilizationData.push({
      budgetId: budget.id,
      categoryName: budget.categoryName,
      categoryColor: budget.categoryColor,
      categoryIcon: budget.categoryIcon,
      budgetAmount: budget.amount,
      period: budget.period,
      ...utilization
    });
    
    // Generate alerts based on threshold
    const threshold = filters.alertThreshold || 80;
    if (utilization.percentageUsed >= threshold) {
      let alertLevel: 'warning' | 'critical' | 'exceeded';
      let message: string;
      
      if (utilization.percentageUsed >= 100) {
        alertLevel = 'exceeded';
        message = `Budget exceeded! Spent $${utilization.spentAmount.toFixed(2)} of $${budget.amount.toFixed(2)} budget.`;
      } else if (utilization.percentageUsed >= 90) {
        alertLevel = 'critical';
        message = `Critical: ${utilization.percentageUsed.toFixed(1)}% of budget used. Only $${utilization.remainingAmount.toFixed(2)} remaining.`;
      } else {
        alertLevel = 'warning';
        message = `Warning: ${utilization.percentageUsed.toFixed(1)}% of budget used. $${utilization.remainingAmount.toFixed(2)} remaining.`;
      }
      
      alerts.push({
        budgetId: budget.id,
        categoryName: budget.categoryName,
        budgetAmount: budget.amount,
        spentAmount: utilization.spentAmount,
        percentageUsed: utilization.percentageUsed,
        alertLevel,
        message
      });
    }
  }
  
  return {
    utilization: utilizationData,
    alerts,
    summary: {
      totalBudgets: utilizationData.length,
      totalBudgetAmount: utilizationData.reduce((sum, b) => sum + b.budgetAmount, 0),
      totalSpentAmount: utilizationData.reduce((sum, b) => sum + b.spentAmount, 0),
      alertsCount: alerts.length,
      exceededCount: alerts.filter(a => a.alertLevel === 'exceeded').length
    }
  };
}

export { 
  getBudgets, 
  getBudgetById, 
  getBudgetUtilization, 
  calculateBudgetUtilization
};

export type {
  TBudgetWithUtilization,
  TBudgetAlert
};
