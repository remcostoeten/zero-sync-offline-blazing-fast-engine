import { createCrudFactory, createDb } from '../../../../shared';
import {
  budgetsSchema,
  transactionsSchema,
  TBudgetInsert,
  TBudgetSelect,
  TBudget
} from '../../../../shared/schemas';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { TBudgetWithUtilization, calculateBudgetUtilization } from '../queries';

const budgetCrud = createCrudFactory<typeof budgetsSchema, TBudgetInsert, TBudgetSelect>(budgetsSchema)();

type TBudgetCreateData = Omit<TBudgetInsert, 'id' | 'createdAt' | 'updatedAt' | 'synced'> & { userId: string };
type TBudgetUpdateData = Partial<TBudgetCreateData> & { id: number; userId: string };
type TBudgetResetOptions = {
  preserveEndDate?: boolean;
  newStartDate?: string;
  resetAmount?: number;
};

async function createBudget(data: TBudgetCreateData): Promise<TBudget> {
  const db = createDb();
  
  console.log('Creating budget with data:', JSON.stringify(data, null, 2));
  
  // Validate category exists
  const categoryExists = await db
    .select({ id: budgetsSchema.categoryId })
    .from(budgetsSchema)
    .where(eq(budgetsSchema.categoryId, data.categoryId))
    .limit(1);
    
  // Check for existing active budget for this category in the same period
  const existingBudget = await db
    .select()
    .from(budgetsSchema)
    .where(and(
      eq(budgetsSchema.categoryId, data.categoryId),
      eq(budgetsSchema.period, data.period),
      eq(budgetsSchema.isActive, true)
    ))
    .limit(1);
    
  if (existingBudget[0]) {
    throw new Error(`An active ${data.period} budget already exists for this category`);
  }
  
  // Set default end date based on period if not provided
  let budgetData = { ...data };
  if (!budgetData.endDate) {
    const startDate = new Date(budgetData.startDate);
    const endDate = new Date(startDate);
    
    if (data.period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1); // Last day of the month
    } else if (data.period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1); // Last day of the year
    }
    
    budgetData.endDate = endDate.toISOString().split('T')[0];
  }
  
  const insertData = {
    ...budgetData,
    userId: data.userId, // Include user ID
    synced: false,
    // Ensure all required fields have default values
    name: budgetData.name || `Budget for Category ${budgetData.categoryId}`, // Ensure name is always provided
    spent: budgetData.spent || 0,
    isActive: budgetData.isActive !== undefined ? budgetData.isActive : true,
    rollover: budgetData.rollover !== undefined ? budgetData.rollover : false,
    carryoverAmount: budgetData.carryoverAmount || 0,
    color: budgetData.color || '#3B82F6',
    priority: budgetData.priority || 'medium',
    autoRenew: budgetData.autoRenew !== undefined ? budgetData.autoRenew : true,
    resetDay: budgetData.resetDay || 1,
    alertThreshold: budgetData.alertThreshold || 0.8
  };
  
  console.log('Inserting budget with data:', JSON.stringify(insertData, null, 2));
  
  return await budgetCrud.create(insertData);
}

async function updateBudget(data: TBudgetUpdateData): Promise<TBudget> {
  const { id, ...updateData } = data;
  
  // If updating category or period, check for conflicts
  if (updateData.categoryId || updateData.period) {
    const db = createDb();
    
    // Get current budget data
    const currentBudget = await db
      .select()
      .from(budgetsSchema)
      .where(and(eq(budgetsSchema.id, id), eq(budgetsSchema.userId, data.userId)))
      .limit(1);
      
    if (!currentBudget[0]) {
      throw new Error('Budget not found');
    }
    
    const newCategoryId = updateData.categoryId || currentBudget[0].categoryId;
    const newPeriod = updateData.period || currentBudget[0].period;
    
    // Check for existing active budget for this category/period combination
    const existingBudget = await db
      .select()
      .from(budgetsSchema)
      .where(and(
        eq(budgetsSchema.categoryId, newCategoryId),
        eq(budgetsSchema.period, newPeriod),
        eq(budgetsSchema.isActive, true),
        sql`${budgetsSchema.id} != ${id}` // Exclude current budget
      ))
      .limit(1);
      
    if (existingBudget[0]) {
      throw new Error(`An active ${newPeriod} budget already exists for this category`);
    }
  }
  
  return await budgetCrud.update(id, updateData);
}

async function deleteBudget(id: number): Promise<boolean> {
  return await budgetCrud.delete(id);
}

async function toggleBudgetStatus(id: number): Promise<TBudget> {
  const db = createDb();
  
  const budget = await db
    .select()
    .from(budgetsSchema)
    .where(eq(budgetsSchema.id, id))
    .limit(1);
    
  if (!budget[0]) {
    throw new Error('Budget not found');
  }
  
  const newStatus = !budget[0].isActive;
  
  // If activating, check for conflicts
  if (newStatus) {
    const existingBudget = await db
      .select()
      .from(budgetsSchema)
      .where(and(
        eq(budgetsSchema.categoryId, budget[0].categoryId),
        eq(budgetsSchema.period, budget[0].period),
        eq(budgetsSchema.isActive, true),
        sql`${budgetsSchema.id} != ${id}`
      ))
      .limit(1);
      
    if (existingBudget[0]) {
      throw new Error(`An active ${budget[0].period} budget already exists for this category`);
    }
  }
  
  return await budgetCrud.update(id, { isActive: newStatus });
}

async function resetBudget(id: number, options: TBudgetResetOptions = {}): Promise<TBudgetWithUtilization> {
  const db = createDb();
  
  // Get current budget
  const budget = await db
    .select()
    .from(budgetsSchema)
    .where(eq(budgetsSchema.id, id))
    .limit(1);
    
  if (!budget[0]) {
    throw new Error('Budget not found');
  }
  
  const currentBudget = budget[0];
  
  // Calculate new dates
  const today = new Date();
  const newStartDate = options.newStartDate || today.toISOString().split('T')[0];
  
  let newEndDate = currentBudget.endDate;
  if (!options.preserveEndDate) {
    const startDate = new Date(newStartDate);
    const endDate = new Date(startDate);
    
    if (currentBudget.period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
    } else if (currentBudget.period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
    }
    
    newEndDate = endDate.toISOString().split('T')[0];
  }
  
  // Update budget with new dates and amount if specified
  const updateData: Partial<TBudgetInsert> = {
    startDate: newStartDate,
    endDate: newEndDate,
    isActive: true
  };
  
  if (options.resetAmount !== undefined) {
    updateData.amount = options.resetAmount;
  }
  
  const updatedBudget = await budgetCrud.update(id, updateData);
  
  // Calculate utilization for the updated budget
  const utilization = await calculateBudgetUtilization(id);
  
  // Get category info for response
  const budgetWithCategory = await db
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
      categoryName: sql<string>`categories.name`,
      categoryColor: sql<string>`categories.color`,
      categoryIcon: sql<string>`categories.icon`
    })
    .from(budgetsSchema)
    .leftJoin(sql`categories`, eq(budgetsSchema.categoryId, sql`categories.id`))
    .where(eq(budgetsSchema.id, id))
    .limit(1);
  
  const budgetData = budgetWithCategory[0];
  
  return {
    ...budgetData,
    spentAmount: utilization.spentAmount,
    remainingAmount: utilization.remainingAmount,
    percentageUsed: utilization.percentageUsed,
    status: utilization.status,
    daysRemaining: utilization.daysRemaining
  };
}

async function bulkCreateBudgets(budgets: TBudgetCreateData[]): Promise<TBudget[]> {
  const results: TBudget[] = [];
  
  for (const budgetData of budgets) {
    try {
      const budget = await createBudget(budgetData);
      results.push(budget);
    } catch (error) {
      console.error(`Failed to create budget for category ${budgetData.categoryId}:`, error);
      // Continue with other budgets instead of failing the entire operation
    }
  }
  
  return results;
}

async function bulkUpdateBudgets(updates: TBudgetUpdateData[]): Promise<TBudget[]> {
  const results: TBudget[] = [];
  
  for (const updateData of updates) {
    try {
      const budget = await updateBudget(updateData);
      results.push(budget);
    } catch (error) {
      console.error(`Failed to update budget ${updateData.id}:`, error);
    }
  }
  
  return results;
}

async function bulkDeleteBudgets(ids: number[]): Promise<{ deleted: number[]; failed: number[] }> {
  const deleted: number[] = [];
  const failed: number[] = [];
  
  for (const id of ids) {
    try {
      const success = await deleteBudget(id);
      if (success) {
        deleted.push(id);
      } else {
        failed.push(id);
      }
    } catch (error) {
      console.error(`Failed to delete budget ${id}:`, error);
      failed.push(id);
    }
  }
  
  return { deleted, failed };
}

export {
  createBudget,
  updateBudget,
  deleteBudget,
  toggleBudgetStatus,
  resetBudget,
  bulkCreateBudgets,
  bulkUpdateBudgets,
  bulkDeleteBudgets
};
