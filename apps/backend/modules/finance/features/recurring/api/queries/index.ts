import { createCrudFactory, createDb } from '../../../../shared';
import {
  recurringTransactionsSchema,
  transactionsSchema,
  categoriesSchema,
  TRecurringTransaction,
  TRecurringTransactionInsert,
  TRecurringTransactionSelect
} from '../../../../shared/schemas';
import { eq, and, gte, lte, desc, asc, like, sql, or, inArray, count } from 'drizzle-orm';

const recurringCrud = createCrudFactory<typeof recurringTransactionsSchema, TRecurringTransactionInsert, TRecurringTransactionSelect>(recurringTransactionsSchema)();

type TRecurringTransactionFilters = {
  categoryId?: number;
  type?: 'income' | 'expense' | 'all';
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'all';
  isActive?: boolean;
  autoGenerate?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  nextExecutionFrom?: string;
  nextExecutionTo?: string;
  sortBy?: 'name' | 'amount' | 'startDate' | 'nextExecution' | 'frequency' | 'categoryName';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
};

type TRecurringTransactionWithDetails = TRecurringTransaction & {
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  nextExecutionDate: string | null;
  remainingOccurrences: number | null;
  generatedCount: number;
  totalExpectedAmount: number | null;
  status: 'active' | 'paused' | 'completed' | 'expired';
  daysUntilNext: number | null;
};

type TSchedulePreview = {
  dates: string[];
  totalOccurrences: number;
  estimatedEndDate: string | null;
  totalAmount: number;
};

// Date calculation utilities
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

function calculateNextExecutionDate(recurring: TRecurringTransaction): string | null {
  if (!recurring.isActive) return null;
  
  const today = new Date();
  const startDate = new Date(recurring.startDate);
  
  // If start date is in the future, that's the next execution
  if (startDate > today) {
    return recurring.startDate;
  }
  
  // Calculate next occurrence based on frequency
  let nextDate = new Date(startDate);
  
  // Handle specific day constraints
  if (recurring.frequency === 'weekly' && recurring.dayOfWeek !== null) {
    // Adjust to the correct day of week
    const dayDiff = recurring.dayOfWeek - nextDate.getDay();
    if (dayDiff !== 0) {
      nextDate.setDate(nextDate.getDate() + dayDiff);
    }
  } else if ((recurring.frequency === 'monthly' || recurring.frequency === 'quarterly') && recurring.dayOfMonth) {
    nextDate.setDate(recurring.dayOfMonth);
  } else if (recurring.frequency === 'yearly' && recurring.dayOfMonth && recurring.monthOfYear) {
    nextDate.setMonth(recurring.monthOfYear - 1, recurring.dayOfMonth);
  }
  
  // Fast-forward to find next occurrence after today
  while (nextDate <= today) {
    nextDate = addInterval(nextDate, recurring.frequency, recurring.interval || 1);
    
    // Apply day constraints again after interval addition
    if (recurring.frequency === 'monthly' || recurring.frequency === 'quarterly') {
      if (recurring.dayOfMonth && nextDate.getDate() !== recurring.dayOfMonth) {
        // Handle month end edge cases
        const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(recurring.dayOfMonth, lastDay));
      }
    } else if (recurring.frequency === 'yearly') {
      if (recurring.monthOfYear && recurring.dayOfMonth) {
        nextDate.setMonth(recurring.monthOfYear - 1, recurring.dayOfMonth);
      }
    }
  }
  
  // Check if next execution would be beyond end date
  if (recurring.endDate && nextDate > new Date(recurring.endDate)) {
    return null;
  }
  
  return nextDate.toISOString().split('T')[0];
}

function calculateRemainingOccurrences(recurring: TRecurringTransaction, generatedCount: number): number | null {
  if (!recurring.maxOccurrences) return null;
  return Math.max(0, recurring.maxOccurrences - generatedCount);
}

function determineStatus(
  recurring: TRecurringTransaction, 
  nextExecution: string | null, 
  remainingOccurrences: number | null
): 'active' | 'paused' | 'completed' | 'expired' {
  if (!recurring.isActive) return 'paused';
  if (!nextExecution) return 'completed';
  if (recurring.endDate && new Date() > new Date(recurring.endDate)) return 'expired';
  if (remainingOccurrences !== null && remainingOccurrences <= 0) return 'completed';
  return 'active';
}

async function getRecurringTransactions(filters: TRecurringTransactionFilters = {}): Promise<TRecurringTransactionWithDetails[]> {
  const db = createDb();
  
  // Base query with category join
  let query = db
    .select({
      id: recurringTransactionsSchema.id,
      name: recurringTransactionsSchema.name,
      description: recurringTransactionsSchema.description,
      categoryId: recurringTransactionsSchema.categoryId,
      amount: recurringTransactionsSchema.amount,
      type: recurringTransactionsSchema.type,
      frequency: recurringTransactionsSchema.frequency,
      interval: recurringTransactionsSchema.interval,
      dayOfWeek: recurringTransactionsSchema.dayOfWeek,
      dayOfMonth: recurringTransactionsSchema.dayOfMonth,
      monthOfYear: recurringTransactionsSchema.monthOfYear,
      startDate: recurringTransactionsSchema.startDate,
      endDate: recurringTransactionsSchema.endDate,
      maxOccurrences: recurringTransactionsSchema.maxOccurrences,
      isActive: recurringTransactionsSchema.isActive,
      autoGenerate: recurringTransactionsSchema.autoGenerate,
      notifyOnGeneration: recurringTransactionsSchema.notifyOnGeneration,
      payee: recurringTransactionsSchema.payee,
      reference: recurringTransactionsSchema.reference,
      tags: recurringTransactionsSchema.tags,
      lastGenerated: recurringTransactionsSchema.lastGenerated,
      generatedCount: recurringTransactionsSchema.generatedCount,
      createdAt: recurringTransactionsSchema.createdAt,
      updatedAt: recurringTransactionsSchema.updatedAt,
      synced: recurringTransactionsSchema.synced,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      categoryIcon: categoriesSchema.icon
    })
    .from(recurringTransactionsSchema)
    .innerJoin(categoriesSchema, eq(recurringTransactionsSchema.categoryId, categoriesSchema.id));

  // Apply filters
  const conditions = [];
  
  if (filters.categoryId) {
    conditions.push(eq(recurringTransactionsSchema.categoryId, filters.categoryId));
  }
  
  if (filters.type && filters.type !== 'all') {
    conditions.push(eq(recurringTransactionsSchema.type, filters.type));
  }
  
  if (filters.frequency && filters.frequency !== 'all') {
    conditions.push(eq(recurringTransactionsSchema.frequency, filters.frequency));
  }
  
  if (filters.isActive !== undefined) {
    conditions.push(eq(recurringTransactionsSchema.isActive, filters.isActive));
  }
  
  if (filters.autoGenerate !== undefined) {
    conditions.push(eq(recurringTransactionsSchema.autoGenerate, filters.autoGenerate));
  }
  
  if (filters.startDateFrom) {
    conditions.push(gte(recurringTransactionsSchema.startDate, filters.startDateFrom));
  }
  
  if (filters.startDateTo) {
    conditions.push(lte(recurringTransactionsSchema.startDate, filters.startDateTo));
  }
  
  if (filters.search) {
    conditions.push(or(
      like(recurringTransactionsSchema.name, `%${filters.search}%`),
      like(recurringTransactionsSchema.description, `%${filters.search}%`),
      like(recurringTransactionsSchema.payee, `%${filters.search}%`),
      like(categoriesSchema.name, `%${filters.search}%`)
    ));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Execute base query
  const recurring = await query
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  // Calculate derived fields for each recurring transaction
  const recurringWithDetails: TRecurringTransactionWithDetails[] = recurring.map(item => {
    const nextExecutionDate = calculateNextExecutionDate(item);
    const remainingOccurrences = calculateRemainingOccurrences(item, item.generatedCount || 0);
    const status = determineStatus(item, nextExecutionDate, remainingOccurrences);
    
    let daysUntilNext: number | null = null;
    if (nextExecutionDate) {
      const today = new Date();
      const nextDate = new Date(nextExecutionDate);
      daysUntilNext = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    let totalExpectedAmount: number | null = null;
    if (remainingOccurrences !== null) {
      totalExpectedAmount = remainingOccurrences * item.amount;
    } else if (item.endDate) {
      // Estimate based on date range
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate);
      const today = new Date();
      const effectiveStart = startDate > today ? startDate : today;
      
      if (effectiveStart <= endDate) {
        const days = Math.ceil((endDate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        let estimatedOccurrences = 0;
        
        switch (item.frequency) {
          case 'daily':
            estimatedOccurrences = Math.ceil(days / (item.interval || 1));
            break;
          case 'weekly':
            estimatedOccurrences = Math.ceil(days / (7 * (item.interval || 1)));
            break;
          case 'biweekly':
            estimatedOccurrences = Math.ceil(days / 14);
            break;
          case 'monthly':
            estimatedOccurrences = Math.ceil(days / (30 * (item.interval || 1)));
            break;
          case 'quarterly':
            estimatedOccurrences = Math.ceil(days / 90);
            break;
          case 'yearly':
            estimatedOccurrences = Math.ceil(days / 365);
            break;
        }
        
        totalExpectedAmount = estimatedOccurrences * item.amount;
      }
    }
    
    return {
      ...item,
      nextExecutionDate,
      remainingOccurrences,
      status,
      daysUntilNext,
      totalExpectedAmount
    };
  });

  // Apply next execution date filters
  let filteredRecurring = recurringWithDetails;
  
  if (filters.nextExecutionFrom) {
    filteredRecurring = filteredRecurring.filter(item => 
      item.nextExecutionDate && item.nextExecutionDate >= filters.nextExecutionFrom!
    );
  }
  
  if (filters.nextExecutionTo) {
    filteredRecurring = filteredRecurring.filter(item => 
      item.nextExecutionDate && item.nextExecutionDate <= filters.nextExecutionTo!
    );
  }
  
  // Sort results
  if (filters.sortBy) {
    filteredRecurring.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'startDate':
          aVal = a.startDate;
          bVal = b.startDate;
          break;
        case 'nextExecution':
          aVal = a.nextExecutionDate || '9999-12-31';
          bVal = b.nextExecutionDate || '9999-12-31';
          break;
        case 'frequency':
          aVal = a.frequency;
          bVal = b.frequency;
          break;
        case 'categoryName':
          aVal = a.categoryName.toLowerCase();
          bVal = b.categoryName.toLowerCase();
          break;
        default:
          aVal = a.nextExecutionDate || '9999-12-31';
          bVal = b.nextExecutionDate || '9999-12-31';
      }
      
      if (filters.sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  }
  
  return filteredRecurring;
}

async function getRecurringTransactionById(id: number): Promise<TRecurringTransactionWithDetails | null> {
  const transactions = await getRecurringTransactions({ limit: 1, offset: 0 });
  const transaction = transactions.find(t => t.id === id);
  return transaction || null;
}

async function getSchedulePreview(
  recurringId: number, 
  fromDate?: string, 
  toDate?: string, 
  maxDates: number = 10
): Promise<TSchedulePreview | null> {
  const db = createDb();
  
  const recurring = await db
    .select()
    .from(recurringTransactionsSchema)
    .where(eq(recurringTransactionsSchema.id, recurringId))
    .limit(1);
    
  if (!recurring[0]) return null;
  
  const recurringData = recurring[0];
  const startDate = new Date(fromDate || recurringData.startDate);
  const endDate = toDate ? new Date(toDate) : (recurringData.endDate ? new Date(recurringData.endDate) : null);
  
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  let occurrences = 0;
  
  // Apply frequency-specific initial date adjustments
  if (recurringData.frequency === 'weekly' && recurringData.dayOfWeek !== null) {
    const dayDiff = recurringData.dayOfWeek - currentDate.getDay();
    currentDate.setDate(currentDate.getDate() + dayDiff);
  } else if ((recurringData.frequency === 'monthly' || recurringData.frequency === 'quarterly') && recurringData.dayOfMonth) {
    currentDate.setDate(recurringData.dayOfMonth);
  } else if (recurringData.frequency === 'yearly' && recurringData.dayOfMonth && recurringData.monthOfYear) {
    currentDate.setMonth(recurringData.monthOfYear - 1, recurringData.dayOfMonth);
  }
  
  while (dates.length < maxDates) {
    // Check end conditions
    if (endDate && currentDate > endDate) break;
    if (recurringData.maxOccurrences && occurrences >= recurringData.maxOccurrences) break;
    
    // Add current date if it's not before start
    if (currentDate >= startDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      occurrences++;
    }
    
    // Calculate next occurrence
    currentDate = addInterval(currentDate, recurringData.frequency, recurringData.interval || 1);
    
    // Re-apply day constraints
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
  
  return {
    dates,
    totalOccurrences: occurrences,
    estimatedEndDate: dates.length > 0 ? dates[dates.length - 1] : null,
    totalAmount: occurrences * recurringData.amount
  };
}

async function getRecurringTransactionsDueForGeneration(date: string = new Date().toISOString().split('T')[0]): Promise<TRecurringTransactionWithDetails[]> {
  const allRecurring = await getRecurringTransactions({ 
    isActive: true, 
    autoGenerate: true,
    limit: 1000 
  });
  
  return allRecurring.filter(recurring => {
    if (!recurring.nextExecutionDate) return false;
    return recurring.nextExecutionDate <= date;
  });
}

async function getRecurringTransactionStats() {
  const db = createDb();
  
  const stats = await db
    .select({
      totalRecurring: count(),
      activeRecurring: sql<number>`SUM(CASE WHEN ${recurringTransactionsSchema.isActive} = true THEN 1 ELSE 0 END)`,
      totalGenerated: sql<number>`SUM(${recurringTransactionsSchema.generatedCount})`,
      avgAmount: sql<number>`AVG(${recurringTransactionsSchema.amount})`,
      totalExpectedMonthly: sql<number>`SUM(CASE 
        WHEN ${recurringTransactionsSchema.frequency} = 'monthly' AND ${recurringTransactionsSchema.isActive} = true 
        THEN ${recurringTransactionsSchema.amount} 
        WHEN ${recurringTransactionsSchema.frequency} = 'weekly' AND ${recurringTransactionsSchema.isActive} = true 
        THEN ${recurringTransactionsSchema.amount} * 4.33
        WHEN ${recurringTransactionsSchema.frequency} = 'daily' AND ${recurringTransactionsSchema.isActive} = true 
        THEN ${recurringTransactionsSchema.amount} * 30
        ELSE 0 
      END)`
    })
    .from(recurringTransactionsSchema);
    
  return stats[0];
}

export {
  getRecurringTransactions,
  getRecurringTransactionById,
  getSchedulePreview,
  getRecurringTransactionsDueForGeneration,
  getRecurringTransactionStats,
  calculateNextExecutionDate,
  TRecurringTransactionWithDetails,
  TSchedulePreview
};
