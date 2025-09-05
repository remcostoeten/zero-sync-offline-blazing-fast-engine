import { createCrudFactory, createDb } from '../../../../shared';
import {
  debtsSchema,
  debtPaymentsSchema,
  TDebt,
  TDebtInsert,
  TDebtSelect,
  TDebtPayment
} from '../../../../shared/schemas';
import { eq, and, gte, lte, desc, asc, like, sql, or, sum, count } from 'drizzle-orm';

const debtCrud = createCrudFactory<typeof debtsSchema, TDebtInsert, TDebtSelect>(debtsSchema)();

type TDebtFilters = {
  debtType?: 'credit_card' | 'personal_loan' | 'mortgage' | 'auto_loan' | 'student_loan' | 'line_of_credit' | 'other' | 'all';
  status?: 'active' | 'paid_off' | 'defaulted' | 'consolidated' | 'all';
  creditor?: string;
  minBalance?: number;
  maxBalance?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  originationFrom?: string;
  originationTo?: string;
  maturityFrom?: string;
  maturityTo?: string;
  sortBy?: 'name' | 'creditor' | 'balance' | 'interestRate' | 'nextPayment' | 'maturityDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
};

type TPaymentFilters = {
  debtId?: number;
  paymentType?: 'regular' | 'extra' | 'minimum' | 'interest_only' | 'all';
  paymentMethod?: 'bank_transfer' | 'check' | 'cash' | 'auto_pay' | 'credit_card' | 'other' | 'all';
  isVerified?: boolean;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'paymentDate' | 'amount' | 'debtName' | 'creditor';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

type TDebtWithDetails = TDebt & {
  totalPaid: number;
  remainingBalance: number;
  monthlyInterest: number;
  payoffDate: string | null;
  totalInterest: number;
  paymentCount: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  isOverdue: boolean;
  daysSinceLastPayment: number | null;
  utilizationRatio: number | null; // For credit cards
  minimumPaymentStatus: 'current' | 'behind' | 'ahead';
};

type TAmortizationEntry = {
  paymentNumber: number;
  paymentDate: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
};

type TAmortizationSchedule = {
  debtId: number;
  debtName: string;
  totalPayments: number;
  totalInterest: number;
  totalAmount: number;
  payoffDate: string;
  monthlyPayment: number;
  schedule: TAmortizationEntry[];
};

type TPaymentStrategy = {
  strategyName: string;
  totalInterest: number;
  totalPayments: number;
  payoffDate: string;
  monthlySavings: number;
  debtOrder: Array<{
    debtId: number;
    debtName: string;
    priority: number;
    payoffOrder: number;
  }>;
};

// Interest calculation utilities
function calculateCompoundInterest(
  principal: number,
  rate: number,
  compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually',
  timeInYears: number
): number {
  const frequencies = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    annually: 1
  };
  
  const n = frequencies[compoundingFrequency];
  const r = rate / 100;
  
  return principal * Math.pow((1 + r / n), n * timeInYears);
}

function calculateSimpleInterest(principal: number, rate: number, timeInYears: number): number {
  return principal * (rate / 100) * timeInYears;
}

function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months;
  
  const monthlyRate = annualRate / 100 / 12;
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / denominator;
}

// Core debt queries
async function getDebts(filters: TDebtFilters = {}): Promise<TDebtWithDetails[]> {
  const db = createDb();
  
  // Base query
  let query = db
    .select({
      id: debtsSchema.id,
      name: debtsSchema.name,
      description: debtsSchema.description,
      creditor: debtsSchema.creditor,
      principal: debtsSchema.principal,
      currentBalance: debtsSchema.currentBalance,
      interestRate: debtsSchema.interestRate,
      interestType: debtsSchema.interestType,
      compoundingFrequency: debtsSchema.compoundingFrequency,
      originationDate: debtsSchema.originationDate,
      maturityDate: debtsSchema.maturityDate,
      minimumPayment: debtsSchema.minimumPayment,
      paymentFrequency: debtsSchema.paymentFrequency,
      nextPaymentDate: debtsSchema.nextPaymentDate,
      debtType: debtsSchema.debtType,
      status: debtsSchema.status,
      accountNumber: debtsSchema.accountNumber,
      creditLimit: debtsSchema.creditLimit,
      tags: debtsSchema.tags,
      notes: debtsSchema.notes,
      createdAt: debtsSchema.createdAt,
      updatedAt: debtsSchema.updatedAt,
      synced: debtsSchema.synced
    })
    .from(debtsSchema);

  // Apply filters
  const conditions = [];
  
  if (filters.debtType && filters.debtType !== 'all') {
    conditions.push(eq(debtsSchema.debtType, filters.debtType));
  }
  
  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(debtsSchema.status, filters.status));
  }
  
  if (filters.creditor) {
    conditions.push(like(debtsSchema.creditor, `%${filters.creditor}%`));
  }
  
  if (filters.minBalance !== undefined) {
    conditions.push(gte(debtsSchema.currentBalance, filters.minBalance));
  }
  
  if (filters.maxBalance !== undefined) {
    conditions.push(lte(debtsSchema.currentBalance, filters.maxBalance));
  }
  
  if (filters.minInterestRate !== undefined) {
    conditions.push(gte(debtsSchema.interestRate, filters.minInterestRate));
  }
  
  if (filters.maxInterestRate !== undefined) {
    conditions.push(lte(debtsSchema.interestRate, filters.maxInterestRate));
  }
  
  if (filters.originationFrom) {
    conditions.push(gte(debtsSchema.originationDate, filters.originationFrom));
  }
  
  if (filters.originationTo) {
    conditions.push(lte(debtsSchema.originationDate, filters.originationTo));
  }
  
  if (filters.search) {
    conditions.push(or(
      like(debtsSchema.name, `%${filters.search}%`),
      like(debtsSchema.creditor, `%${filters.search}%`),
      like(debtsSchema.description, `%${filters.search}%`)
    ));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Execute base query
  const debts = await query
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  // Enrich with payment data and calculations
  const debtsWithDetails: TDebtWithDetails[] = [];
  
  for (const debt of debts) {
    // Get payment summary
    const paymentSummary = await db
      .select({
        totalPaid: sql<number>`COALESCE(SUM(${debtPaymentsSchema.amount}), 0)`,
        paymentCount: sql<number>`COUNT(${debtPaymentsSchema.id})`,
        lastPaymentDate: sql<string>`MAX(${debtPaymentsSchema.paymentDate})`,
        lastPaymentAmount: sql<number>`MAX(CASE WHEN ${debtPaymentsSchema.paymentDate} = MAX(${debtPaymentsSchema.paymentDate}) THEN ${debtPaymentsSchema.amount} END)`
      })
      .from(debtPaymentsSchema)
      .where(eq(debtPaymentsSchema.debtId, debt.id));
      
    const summary = paymentSummary[0];
    
    // Calculate derived fields
    const totalPaid = summary?.totalPaid || 0;
    const remainingBalance = Math.max(0, debt.currentBalance);
    const monthlyInterest = (remainingBalance * (debt.interestRate / 100)) / 12;
    
    // Calculate utilization ratio for credit cards
    let utilizationRatio: number | null = null;
    if (debt.debtType === 'credit_card' && debt.creditLimit) {
      utilizationRatio = (debt.currentBalance / debt.creditLimit) * 100;
    }
    
    // Calculate days since last payment
    let daysSinceLastPayment: number | null = null;
    if (summary?.lastPaymentDate) {
      const lastPayment = new Date(summary.lastPaymentDate);
      const today = new Date();
      daysSinceLastPayment = Math.floor((today.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Check if debt is overdue
    const isOverdue = debt.nextPaymentDate ? new Date(debt.nextPaymentDate) < new Date() : false;
    
    // Estimate payoff date (simple calculation)
    let payoffDate: string | null = null;
    let totalInterest = 0;
    
    if (debt.minimumPayment && remainingBalance > 0 && debt.interestRate > 0) {
      const monthsToPayoff = Math.log(1 + (remainingBalance * (debt.interestRate / 100 / 12)) / debt.minimumPayment) / 
                            Math.log(1 + (debt.interestRate / 100 / 12));
      
      if (monthsToPayoff > 0 && monthsToPayoff < 1200) { // Cap at 100 years
        const payoffDateObj = new Date();
        payoffDateObj.setMonth(payoffDateObj.getMonth() + Math.ceil(monthsToPayoff));
        payoffDate = payoffDateObj.toISOString().split('T')[0];
        
        totalInterest = (debt.minimumPayment * Math.ceil(monthsToPayoff)) - remainingBalance;
      }
    }
    
    // Determine minimum payment status
    let minimumPaymentStatus: 'current' | 'behind' | 'ahead' = 'current';
    if (isOverdue) {
      minimumPaymentStatus = 'behind';
    } else if (summary?.lastPaymentAmount && debt.minimumPayment && 
               summary.lastPaymentAmount > debt.minimumPayment * 1.1) {
      minimumPaymentStatus = 'ahead';
    }
    
    debtsWithDetails.push({
      ...debt,
      totalPaid,
      remainingBalance,
      monthlyInterest,
      payoffDate,
      totalInterest: Math.max(0, totalInterest),
      paymentCount: summary?.paymentCount || 0,
      lastPaymentDate: summary?.lastPaymentDate || null,
      lastPaymentAmount: summary?.lastPaymentAmount || null,
      isOverdue,
      daysSinceLastPayment,
      utilizationRatio,
      minimumPaymentStatus
    });
  }
  
  // Sort results
  if (filters.sortBy) {
    debtsWithDetails.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'creditor':
          aVal = a.creditor.toLowerCase();
          bVal = b.creditor.toLowerCase();
          break;
        case 'balance':
          aVal = a.remainingBalance;
          bVal = b.remainingBalance;
          break;
        case 'interestRate':
          aVal = a.interestRate;
          bVal = b.interestRate;
          break;
        case 'nextPayment':
          aVal = a.nextPaymentDate || '9999-12-31';
          bVal = b.nextPaymentDate || '9999-12-31';
          break;
        case 'maturityDate':
          aVal = a.maturityDate || '9999-12-31';
          bVal = b.maturityDate || '9999-12-31';
          break;
        default:
          aVal = a.remainingBalance;
          bVal = b.remainingBalance;
      }
      
      if (filters.sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  }
  
  return debtsWithDetails;
}

async function getDebtById(id: number): Promise<TDebtWithDetails | null> {
  const debts = await getDebts({ limit: 1000 });
  return debts.find(debt => debt.id === id) || null;
}

async function getDebtPayments(filters: TPaymentFilters = {}): Promise<Array<TDebtPayment & { debtName: string; creditor: string }>> {
  const db = createDb();
  
  let query = db
    .select({
      id: debtPaymentsSchema.id,
      debtId: debtPaymentsSchema.debtId,
      amount: debtPaymentsSchema.amount,
      paymentDate: debtPaymentsSchema.paymentDate,
      paymentType: debtPaymentsSchema.paymentType,
      principalAmount: debtPaymentsSchema.principalAmount,
      interestAmount: debtPaymentsSchema.interestAmount,
      feesAmount: debtPaymentsSchema.feesAmount,
      paymentMethod: debtPaymentsSchema.paymentMethod,
      reference: debtPaymentsSchema.reference,
      description: debtPaymentsSchema.description,
      isVerified: debtPaymentsSchema.isVerified,
      createdAt: debtPaymentsSchema.createdAt,
      updatedAt: debtPaymentsSchema.updatedAt,
      synced: debtPaymentsSchema.synced,
      debtName: debtsSchema.name,
      creditor: debtsSchema.creditor
    })
    .from(debtPaymentsSchema)
    .innerJoin(debtsSchema, eq(debtPaymentsSchema.debtId, debtsSchema.id));

  // Apply filters
  const conditions = [];
  
  if (filters.debtId) {
    conditions.push(eq(debtPaymentsSchema.debtId, filters.debtId));
  }
  
  if (filters.paymentType && filters.paymentType !== 'all') {
    conditions.push(eq(debtPaymentsSchema.paymentType, filters.paymentType));
  }
  
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    conditions.push(eq(debtPaymentsSchema.paymentMethod, filters.paymentMethod));
  }
  
  if (filters.isVerified !== undefined) {
    conditions.push(eq(debtPaymentsSchema.isVerified, filters.isVerified));
  }
  
  if (filters.paymentDateFrom) {
    conditions.push(gte(debtPaymentsSchema.paymentDate, filters.paymentDateFrom));
  }
  
  if (filters.paymentDateTo) {
    conditions.push(lte(debtPaymentsSchema.paymentDate, filters.paymentDateTo));
  }
  
  if (filters.minAmount !== undefined) {
    conditions.push(gte(debtPaymentsSchema.amount, filters.minAmount));
  }
  
  if (filters.maxAmount !== undefined) {
    conditions.push(lte(debtPaymentsSchema.amount, filters.maxAmount));
  }

  // Apply sorting
  const sortColumn = filters.sortBy === 'amount' ? debtPaymentsSchema.amount :
                    filters.sortBy === 'debtName' ? debtsSchema.name :
                    filters.sortBy === 'creditor' ? debtsSchema.creditor :
                    debtPaymentsSchema.paymentDate;
                    
  const sortDirection = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
  
  // Execute query with all chaining in one expression
  return conditions.length > 0
    ? await query
        .where(and(...conditions))
        .orderBy(sortDirection)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
    : await query
        .orderBy(sortDirection)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);
}

async function generateAmortizationSchedule(
  debtId: number,
  paymentAmount?: number,
  extraPayment: number = 0,
  maxPayments: number = 360
): Promise<TAmortizationSchedule | null> {
  const debt = await getDebtById(debtId);
  if (!debt) return null;
  
  const principal = debt.remainingBalance;
  const monthlyRate = debt.interestRate / 100 / 12;
  const monthlyPayment = paymentAmount || debt.minimumPayment || calculateMonthlyPayment(principal, debt.interestRate, maxPayments);
  
  if (monthlyPayment <= (principal * monthlyRate) && debt.interestRate > 0) {
    // Payment doesn't cover interest - infinite loan
    return null;
  }
  
  const schedule: TAmortizationEntry[] = [];
  let remainingBalance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let paymentNumber = 1;
  
  const startDate = new Date();
  
  while (remainingBalance > 0.01 && paymentNumber <= maxPayments) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + paymentNumber - 1);
    
    const interestAmount = remainingBalance * monthlyRate;
    const totalPaymentAmount = Math.min(monthlyPayment + extraPayment, remainingBalance + interestAmount);
    const principalAmount = totalPaymentAmount - interestAmount;
    
    remainingBalance = Math.max(0, remainingBalance - principalAmount);
    cumulativeInterest += interestAmount;
    cumulativePrincipal += principalAmount;
    
    schedule.push({
      paymentNumber,
      paymentDate: paymentDate.toISOString().split('T')[0],
      paymentAmount: totalPaymentAmount,
      principalAmount,
      interestAmount,
      remainingBalance,
      cumulativeInterest,
      cumulativePrincipal
    });
    
    paymentNumber++;
  }
  
  return {
    debtId,
    debtName: debt.name,
    totalPayments: schedule.length,
    totalInterest: cumulativeInterest,
    totalAmount: principal + cumulativeInterest,
    payoffDate: schedule[schedule.length - 1]?.paymentDate || '',
    monthlyPayment: monthlyPayment + extraPayment,
    schedule
  };
}

async function calculateDebtStatistics() {
  const db = createDb();
  
  const stats = await db
    .select({
      totalDebts: count(),
      totalPrincipal: sql<number>`SUM(${debtsSchema.principal})`,
      totalCurrentBalance: sql<number>`SUM(${debtsSchema.currentBalance})`,
      averageInterestRate: sql<number>`AVG(${debtsSchema.interestRate})`,
      highestBalance: sql<number>`MAX(${debtsSchema.currentBalance})`,
      activeDebts: sql<number>`SUM(CASE WHEN ${debtsSchema.status} = 'active' THEN 1 ELSE 0 END)`
    })
    .from(debtsSchema);
    
  const paymentStats = await db
    .select({
      totalPayments: count(),
      totalAmountPaid: sql<number>`SUM(${debtPaymentsSchema.amount})`,
      averagePayment: sql<number>`AVG(${debtPaymentsSchema.amount})`,
      lastPaymentDate: sql<string>`MAX(${debtPaymentsSchema.paymentDate})`
    })
    .from(debtPaymentsSchema);
    
  return {
    debts: stats[0],
    payments: paymentStats[0]
  };
}

async function generatePaymentStrategies(debtIds: number[]): Promise<TPaymentStrategy[]> {
  const debts = await Promise.all(debtIds.map(id => getDebtById(id)));
  const validDebts = debts.filter(Boolean) as TDebtWithDetails[];
  
  if (validDebts.length === 0) return [];
  
  const strategies: TPaymentStrategy[] = [];
  
  // Avalanche strategy (highest interest first)
  const avalancheOrder = [...validDebts].sort((a, b) => b.interestRate - a.interestRate);
  strategies.push({
    strategyName: 'Debt Avalanche (Highest Interest First)',
    ...calculateStrategyMetrics(avalancheOrder),
    debtOrder: avalancheOrder.map((debt, index) => ({
      debtId: debt.id,
      debtName: debt.name,
      priority: debt.interestRate,
      payoffOrder: index + 1
    }))
  });
  
  // Snowball strategy (smallest balance first)
  const snowballOrder = [...validDebts].sort((a, b) => a.remainingBalance - b.remainingBalance);
  strategies.push({
    strategyName: 'Debt Snowball (Smallest Balance First)',
    ...calculateStrategyMetrics(snowballOrder),
    debtOrder: snowballOrder.map((debt, index) => ({
      debtId: debt.id,
      debtName: debt.name,
      priority: debt.remainingBalance,
      payoffOrder: index + 1
    }))
  });
  
  // Minimum payments only
  strategies.push({
    strategyName: 'Minimum Payments Only',
    ...calculateMinimumPaymentStrategy(validDebts),
    debtOrder: validDebts.map((debt, index) => ({
      debtId: debt.id,
      debtName: debt.name,
      priority: 0,
      payoffOrder: index + 1
    }))
  });
  
  return strategies;
}

function calculateStrategyMetrics(debts: TDebtWithDetails[]): Omit<TPaymentStrategy, 'strategyName' | 'debtOrder'> {
  // Simplified calculation - in practice, this would be more complex
  const totalBalance = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
  const weightedInterestRate = debts.reduce((sum, debt) => sum + (debt.interestRate * debt.remainingBalance), 0) / totalBalance;
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);
  
  // Rough estimates
  const monthsToPayoff = Math.ceil(totalBalance / totalMinimumPayments);
  const totalInterest = (totalBalance * (weightedInterestRate / 100 / 12)) * monthsToPayoff * 0.6; // Simplified
  
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);
  
  return {
    totalInterest,
    totalPayments: monthsToPayoff,
    payoffDate: payoffDate.toISOString().split('T')[0],
    monthlySavings: 0 // Would calculate compared to minimum strategy
  };
}

function calculateMinimumPaymentStrategy(debts: TDebtWithDetails[]): Omit<TPaymentStrategy, 'strategyName' | 'debtOrder'> {
  const totalBalance = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);
  const weightedInterestRate = debts.reduce((sum, debt) => sum + (debt.interestRate * debt.remainingBalance), 0) / totalBalance;
  
  // Rough calculation for minimum payments only
  const monthsToPayoff = Math.ceil(Math.log(1 + (totalBalance * (weightedInterestRate / 100 / 12)) / totalMinimumPayments) / 
                                   Math.log(1 + (weightedInterestRate / 100 / 12)));
  
  const totalInterest = (totalMinimumPayments * monthsToPayoff) - totalBalance;
  
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);
  
  return {
    totalInterest: Math.max(0, totalInterest),
    totalPayments: monthsToPayoff,
    payoffDate: payoffDate.toISOString().split('T')[0],
    monthlySavings: 0
  };
}

export {
  getDebts,
  getDebtById,
  getDebtPayments,
  generateAmortizationSchedule,
  calculateDebtStatistics,
  generatePaymentStrategies,
  calculateCompoundInterest,
  calculateSimpleInterest
};

export type {
  TDebtWithDetails,
  TAmortizationSchedule,
  TPaymentStrategy,
  TAmortizationEntry
};
