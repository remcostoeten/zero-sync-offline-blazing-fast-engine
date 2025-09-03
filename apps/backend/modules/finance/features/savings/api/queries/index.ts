import { createCrudFactory, createDb } from '../../../../shared';
import { 
  savingsGoalsSchema, 
  savingsTransactionsSchema,
  TSavingsGoal, 
  TSavingsGoalInsert, 
  TSavingsGoalSelect,
  TSavingsTransaction,
  TSavingsTransactionInsert,
  TSavingsTransactionSelect
} from '../../../../shared/schemas';
import { eq, and, gte, lte, desc, asc, sum, sql } from 'drizzle-orm';

const savingsGoalCrud = createCrudFactory<typeof savingsGoalsSchema, TSavingsGoalInsert, TSavingsGoalSelect>(savingsGoalsSchema)();
const savingsTransactionCrud = createCrudFactory<typeof savingsTransactionsSchema, TSavingsTransactionInsert, TSavingsTransactionSelect>(savingsTransactionsSchema)();

type TSavingsGoalsFilters = {
  includeCompleted?: boolean;
  sortBy?: 'name' | 'targetAmount' | 'progress' | 'deadline' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

type TSavingsGoalWithProgress = TSavingsGoal & {
  netContribution: number;
  progress: number;
  remaining: number;
  isCompleted: boolean;
  transactionCount: number;
};

async function calculateSavingsProgress(goalId: number) {
  const db = createDb();
  
  const result = await db
    .select({
      deposits: sql<number>`COALESCE(SUM(CASE WHEN ${savingsTransactionsSchema.type} = 'deposit' THEN ${savingsTransactionsSchema.amount} ELSE 0 END), 0)`,
      withdrawals: sql<number>`COALESCE(SUM(CASE WHEN ${savingsTransactionsSchema.type} = 'withdrawal' THEN ${savingsTransactionsSchema.amount} ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(${savingsTransactionsSchema.id})`
    })
    .from(savingsTransactionsSchema)
    .where(eq(savingsTransactionsSchema.savingsGoalId, goalId))
    .groupBy(savingsTransactionsSchema.savingsGoalId);

  const stats = result[0] || { deposits: 0, withdrawals: 0, transactionCount: 0 };
  const netContribution = stats.deposits - stats.withdrawals;
  
  return {
    netContribution,
    deposits: stats.deposits,
    withdrawals: stats.withdrawals,
    transactionCount: stats.transactionCount
  };
}

async function getSavingsGoals(filters: TSavingsGoalsFilters = {}): Promise<TSavingsGoalWithProgress[]> {
  const db = createDb();
  
  // Get all goals first
  const goals = await db
    .select()
    .from(savingsGoalsSchema)
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  // Calculate progress for each goal
  const goalsWithProgress: TSavingsGoalWithProgress[] = [];
  
  for (const goal of goals) {
    const progressStats = await calculateSavingsProgress(goal.id);
    const progress = goal.targetAmount > 0 ? (progressStats.netContribution / goal.targetAmount) * 100 : 0;
    const remaining = Math.max(0, goal.targetAmount - progressStats.netContribution);
    const isCompleted = progressStats.netContribution >= goal.targetAmount;
    
    // Apply completed filter
    if (filters.includeCompleted === false && isCompleted) continue;
    if (filters.includeCompleted === true && !isCompleted) continue;
    
    goalsWithProgress.push({
      ...goal,
      netContribution: progressStats.netContribution,
      progress: Math.min(100, progress),
      remaining,
      isCompleted,
      transactionCount: progressStats.transactionCount
    });
  }
  
  // Sort results
  if (filters.sortBy) {
    goalsWithProgress.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case 'progress':
          aVal = a.progress;
          bVal = b.progress;
          break;
        case 'targetAmount':
          aVal = a.targetAmount;
          bVal = b.targetAmount;
          break;
        case 'deadline':
          aVal = a.deadline || '9999-12-31';
          bVal = b.deadline || '9999-12-31';
          break;
        case 'createdAt':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (filters.sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  }
  
  return goalsWithProgress;
}

async function getSavingsGoalById(id: number): Promise<TSavingsGoalWithProgress | null> {
  const goal = await savingsGoalCrud.read(id);
  if (!goal) return null;
  
  const progressStats = await calculateSavingsProgress(id);
  const progress = goal.targetAmount > 0 ? (progressStats.netContribution / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - progressStats.netContribution);
  const isCompleted = progressStats.netContribution >= goal.targetAmount;
  
  return {
    ...goal,
    netContribution: progressStats.netContribution,
    progress: Math.min(100, progress),
    remaining,
    isCompleted,
    transactionCount: progressStats.transactionCount
  };
}

type TSavingsTransactionsFilters = {
  goalId?: number;
  type?: 'deposit' | 'withdrawal';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

async function getSavingsTransactions(filters: TSavingsTransactionsFilters = {}) {
  const db = createDb();
  
  let query = db
    .select({
      id: savingsTransactionsSchema.id,
      savingsGoalId: savingsTransactionsSchema.savingsGoalId,
      amount: savingsTransactionsSchema.amount,
      type: savingsTransactionsSchema.type,
      note: savingsTransactionsSchema.note,
      date: savingsTransactionsSchema.date,
      createdAt: savingsTransactionsSchema.createdAt,
      updatedAt: savingsTransactionsSchema.updatedAt,
      synced: savingsTransactionsSchema.synced,
      goalName: savingsGoalsSchema.name,
      goalColor: savingsGoalsSchema.color,
      goalIcon: savingsGoalsSchema.icon
    })
    .from(savingsTransactionsSchema)
    .innerJoin(savingsGoalsSchema, eq(savingsTransactionsSchema.savingsGoalId, savingsGoalsSchema.id));

  const conditions = [];
  
  if (filters.goalId) {
    conditions.push(eq(savingsTransactionsSchema.savingsGoalId, filters.goalId));
  }
  
  if (filters.type) {
    conditions.push(eq(savingsTransactionsSchema.type, filters.type));
  }
  
  if (filters.startDate) {
    conditions.push(gte(savingsTransactionsSchema.date, filters.startDate));
  }
  
  if (filters.endDate) {
    conditions.push(lte(savingsTransactionsSchema.date, filters.endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(savingsTransactionsSchema.date), desc(savingsTransactionsSchema.createdAt));

  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters.offset) {
    query = query.offset(filters.offset);
  }

  return query;
}

export { 
  getSavingsGoals, 
  getSavingsGoalById, 
  getSavingsTransactions, 
  calculateSavingsProgress,
  TSavingsGoalWithProgress
};
