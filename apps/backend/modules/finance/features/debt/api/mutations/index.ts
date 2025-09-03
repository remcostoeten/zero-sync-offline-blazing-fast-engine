import { createCrudFactory, createDb } from '../../../../shared';
import {
  debtsSchema,
  debtPaymentsSchema,
  transactionsSchema,
  TDebtInsert,
  TDebtSelect,
  TDebt,
  TDebtPaymentInsert,
  TDebtPayment,
  TTransactionInsert
} from '../../../../shared/schemas';
import { eq, and, sql, desc } from 'drizzle-orm';
import { getDebtById, TDebtWithDetails, calculateCompoundInterest, calculateSimpleInterest } from '../queries';

const debtCrud = createCrudFactory<typeof debtsSchema, TDebtInsert, TDebtSelect>(debtsSchema)();
const paymentCrud = createCrudFactory<typeof debtPaymentsSchema, TDebtPaymentInsert, any>(debtPaymentsSchema)();
const transactionCrud = createCrudFactory<typeof transactionsSchema, TTransactionInsert, any>(transactionsSchema)();

type TDebtCreateData = Omit<TDebtInsert, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;
type TDebtUpdateData = Partial<TDebtCreateData> & { id: number };
type TPaymentCreateData = Omit<TDebtPaymentInsert, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;
type TPaymentUpdateData = Partial<TPaymentCreateData> & { id: number };

type TPaymentAllocation = {
  principalAmount: number;
  interestAmount: number;
  feesAmount: number;
};

type TPaymentResult = {
  payment: TDebtPayment;
  oldBalance: number;
  newBalance: number;
  principalPaid: number;
  interestPaid: number;
  transaction?: any;
};

type TConsolidationResult = {
  newDebt: TDebt;
  consolidatedDebts: TDebt[];
  totalConsolidatedAmount: number;
  totalSavings: number;
  consolidationPayment: TDebtPayment;
};

// Payment allocation utilities
function calculatePaymentAllocation(
  debt: TDebtWithDetails,
  paymentAmount: number,
  paymentDate: string
): TPaymentAllocation {
  if (paymentAmount <= 0) {
    return { principalAmount: 0, interestAmount: 0, feesAmount: 0 };
  }
  
  // Calculate accrued interest since last payment or debt origination
  const lastPaymentDate = debt.lastPaymentDate || debt.originationDate;
  const daysSinceLastPayment = Math.floor(
    (new Date(paymentDate).getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let interestAmount = 0;
  
  if (debt.interestRate > 0 && daysSinceLastPayment > 0) {
    const dailyRate = debt.interestRate / 100 / 365;
    
    if (debt.interestType === 'simple') {
      interestAmount = debt.remainingBalance * dailyRate * daysSinceLastPayment;
    } else {
      // Compound interest - approximate daily compounding
      const compoundFactor = Math.pow(1 + dailyRate, daysSinceLastPayment);
      interestAmount = debt.remainingBalance * (compoundFactor - 1);
    }
  }
  
  // Ensure interest doesn't exceed payment amount
  interestAmount = Math.min(interestAmount, paymentAmount);
  
  // Remaining amount goes to principal
  const principalAmount = Math.min(paymentAmount - interestAmount, debt.remainingBalance);
  
  // Any remaining amount is considered fees/overpayment
  const feesAmount = paymentAmount - interestAmount - principalAmount;
  
  return {
    principalAmount: Math.max(0, principalAmount),
    interestAmount: Math.max(0, interestAmount),
    feesAmount: Math.max(0, feesAmount)
  };
}

function calculateNextPaymentDate(debt: TDebt, currentPaymentDate: string): string {
  const paymentDate = new Date(currentPaymentDate);
  
  switch (debt.paymentFrequency) {
    case 'weekly':
      paymentDate.setDate(paymentDate.getDate() + 7);
      break;
    case 'biweekly':
      paymentDate.setDate(paymentDate.getDate() + 14);
      break;
    case 'monthly':
      paymentDate.setMonth(paymentDate.getMonth() + 1);
      break;
    case 'quarterly':
      paymentDate.setMonth(paymentDate.getMonth() + 3);
      break;
    default:
      paymentDate.setMonth(paymentDate.getMonth() + 1); // Default to monthly
  }
  
  return paymentDate.toISOString().split('T')[0];
}

// Core debt mutations
async function createDebt(data: TDebtCreateData): Promise<TDebt> {
  // Validate business rules
  if (data.currentBalance > data.principal && 
      !['credit_card', 'line_of_credit'].includes(data.debtType)) {
    throw new Error('Current balance cannot exceed principal for this debt type');
  }
  
  if (data.debtType === 'credit_card' && data.creditLimit && data.currentBalance > data.creditLimit) {
    throw new Error('Current balance cannot exceed credit limit');
  }
  
  return await debtCrud.create(data);
}

async function updateDebt(data: TDebtUpdateData): Promise<TDebt> {
  const { id, ...updateData } = data;
  
  const existingDebt = await debtCrud.findById(id);
  if (!existingDebt) {
    throw new Error('Debt not found');
  }
  
  // Validate business rules for updates
  const newBalance = updateData.currentBalance ?? existingDebt.currentBalance;
  const newPrincipal = updateData.principal ?? existingDebt.principal;
  const debtType = updateData.debtType ?? existingDebt.debtType;
  const creditLimit = updateData.creditLimit ?? existingDebt.creditLimit;
  
  if (newBalance > newPrincipal && !['credit_card', 'line_of_credit'].includes(debtType)) {
    throw new Error('Current balance cannot exceed principal for this debt type');
  }
  
  if (debtType === 'credit_card' && creditLimit && newBalance > creditLimit) {
    throw new Error('Current balance cannot exceed credit limit');
  }
  
  return await debtCrud.update(id, updateData);
}

async function deleteDebt(id: number, deletePayments: boolean = false): Promise<boolean> {
  const db = createDb();
  
  if (deletePayments) {
    // Delete all related payments first
    await db
      .delete(debtPaymentsSchema)
      .where(eq(debtPaymentsSchema.debtId, id));
  } else {
    // Check if debt has payments
    const paymentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(debtPaymentsSchema)
      .where(eq(debtPaymentsSchema.debtId, id));
      
    if (paymentCount[0].count > 0) {
      throw new Error('Cannot delete debt with existing payments. Use deletePayments=true to force deletion.');
    }
  }
  
  return await debtCrud.delete(id);
}

async function processPayment(
  debtId: number,
  paymentData: TPaymentCreateData,
  createTransaction: boolean = true
): Promise<TPaymentResult> {
  const db = createDb();
  
  const debt = await getDebtById(debtId);
  if (!debt) {
    throw new Error('Debt not found');
  }
  
  if (debt.status !== 'active') {
    throw new Error('Cannot make payment on inactive debt');
  }
  
  const oldBalance = debt.remainingBalance;
  
  // Auto-calculate payment allocation if not provided
  let allocation: TPaymentAllocation;
  if (paymentData.principalAmount !== undefined && paymentData.interestAmount !== undefined) {
    allocation = {
      principalAmount: paymentData.principalAmount,
      interestAmount: paymentData.interestAmount,
      feesAmount: paymentData.feesAmount || 0
    };
  } else {
    allocation = calculatePaymentAllocation(debt, paymentData.amount, paymentData.paymentDate);
  }
  
  // Create payment record
  const paymentCreateData: TDebtPaymentInsert = {
    ...paymentData,
    principalAmount: allocation.principalAmount,
    interestAmount: allocation.interestAmount,
    feesAmount: allocation.feesAmount
  };
  
  const payment = await paymentCrud.create(paymentCreateData);
  
  // Update debt balance and next payment date
  const newBalance = Math.max(0, oldBalance - allocation.principalAmount);
  const nextPaymentDate = calculateNextPaymentDate(debt, paymentData.paymentDate);
  
  const debtUpdateData: Partial<TDebtInsert> = {
    currentBalance: newBalance,
    nextPaymentDate: nextPaymentDate
  };
  
  // Mark debt as paid off if balance is zero
  if (newBalance === 0) {
    debtUpdateData.status = 'paid_off';
    debtUpdateData.nextPaymentDate = null;
  }
  
  await debtCrud.update(debtId, debtUpdateData);
  
  // Optionally create corresponding transaction
  let transaction;
  if (createTransaction) {
    const transactionData: TTransactionInsert = {
      amount: paymentData.amount,
      type: 'expense',
      categoryId: 1, // TODO: Should be configurable or derived from debt category
      date: paymentData.paymentDate,
      description: `Payment for ${debt.name} to ${debt.creditor}`,
      payee: debt.creditor,
      reference: paymentData.reference,
      debtPaymentId: payment.id
    };
    
    try {
      transaction = await transactionCrud.create(transactionData);
    } catch (error) {
      console.warn('Failed to create corresponding transaction:', error);
    }
  }
  
  return {
    payment,
    oldBalance,
    newBalance,
    principalPaid: allocation.principalAmount,
    interestPaid: allocation.interestAmount,
    transaction
  };
}

async function updatePayment(data: TPaymentUpdateData): Promise<TDebtPayment> {
  const { id, ...updateData } = data;
  
  const existingPayment = await paymentCrud.findById(id);
  if (!existingPayment) {
    throw new Error('Payment not found');
  }
  
  // If amount or allocation is being updated, recalculate debt balance
  if (updateData.amount || updateData.principalAmount || updateData.interestAmount) {
    const debt = await getDebtById(existingPayment.debtId);
    if (!debt) {
      throw new Error('Associated debt not found');
    }
    
    // Reverse the old payment's effect on balance
    const oldPrincipalAmount = existingPayment.principalAmount || 0;
    const newPrincipalAmount = updateData.principalAmount ?? oldPrincipalAmount;
    const balanceDifference = newPrincipalAmount - oldPrincipalAmount;
    
    const adjustedBalance = Math.max(0, debt.remainingBalance - balanceDifference);
    
    await debtCrud.update(debt.id, { currentBalance: adjustedBalance });
  }
  
  return await paymentCrud.update(id, updateData);
}

async function deletePayment(id: number, adjustDebtBalance: boolean = true): Promise<boolean> {
  const payment = await paymentCrud.findById(id);
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  if (adjustDebtBalance) {
    // Restore the principal amount to the debt balance
    const debt = await getDebtById(payment.debtId);
    if (debt) {
      const principalAmount = payment.principalAmount || 0;
      const restoredBalance = debt.remainingBalance + principalAmount;
      
      await debtCrud.update(payment.debtId, { 
        currentBalance: restoredBalance,
        status: restoredBalance > 0 ? 'active' : 'paid_off'
      });
    }
  }
  
  return await paymentCrud.delete(id);
}

async function consolidateDebts(
  sourceDebtIds: number[],
  newDebtData: Omit<TDebtCreateData, 'principal' | 'currentBalance'>,
  consolidationDate: string = new Date().toISOString().split('T')[0],
  consolidationFees: number = 0
): Promise<TConsolidationResult> {
  const db = createDb();
  
  // Validate source debts
  const sourceDebts = await Promise.all(sourceDebtIds.map(id => getDebtById(id)));
  const validDebts = sourceDebts.filter(Boolean) as TDebtWithDetails[];
  
  if (validDebts.length !== sourceDebtIds.length) {
    throw new Error('One or more source debts not found');
  }
  
  if (validDebts.some(debt => debt.status !== 'active')) {
    throw new Error('All source debts must be active');
  }
  
  // Calculate total consolidation amount
  const totalBalance = validDebts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
  const totalConsolidatedAmount = totalBalance + consolidationFees;
  
  // Calculate potential savings (simplified)
  const currentWeightedRate = validDebts.reduce((sum, debt) => 
    sum + (debt.interestRate * debt.remainingBalance), 0
  ) / totalBalance;
  
  const potentialSavings = Math.max(0, currentWeightedRate - newDebtData.interestRate);
  const totalSavings = (totalBalance * (potentialSavings / 100)) * 5; // 5-year estimate
  
  // Create new consolidated debt
  const consolidatedDebtData: TDebtInsert = {
    ...newDebtData,
    principal: totalConsolidatedAmount,
    currentBalance: totalConsolidatedAmount,
    originationDate: consolidationDate
  };
  
  const newDebt = await debtCrud.create(consolidatedDebtData);
  
  // Create consolidation payment record
  const consolidationPaymentData: TDebtPaymentInsert = {
    debtId: newDebt.id,
    amount: totalConsolidatedAmount,
    paymentDate: consolidationDate,
    paymentType: 'regular',
    principalAmount: totalBalance,
    interestAmount: 0,
    feesAmount: consolidationFees,
    description: `Debt consolidation from ${validDebts.length} debts`,
    isVerified: true
  };
  
  const consolidationPayment = await paymentCrud.create(consolidationPaymentData);
  
  // Mark source debts as consolidated and create payoff payments
  const consolidatedDebts: TDebt[] = [];
  
  for (const debt of validDebts) {
    // Create final payment for each source debt
    const payoffPaymentData: TDebtPaymentInsert = {
      debtId: debt.id,
      amount: debt.remainingBalance,
      paymentDate: consolidationDate,
      paymentType: 'regular',
      principalAmount: debt.remainingBalance,
      interestAmount: 0,
      feesAmount: 0,
      description: 'Paid off through debt consolidation',
      isVerified: true
    };
    
    await paymentCrud.create(payoffPaymentData);
    
    // Update debt status
    const updatedDebt = await debtCrud.update(debt.id, {
      status: 'consolidated',
      currentBalance: 0,
      nextPaymentDate: null
    });
    
    consolidatedDebts.push(updatedDebt);
  }
  
  return {
    newDebt,
    consolidatedDebts,
    totalConsolidatedAmount,
    totalSavings,
    consolidationPayment
  };
}

// Bulk operations
async function bulkCreateDebts(debts: TDebtCreateData[]): Promise<TDebt[]> {
  const results: TDebt[] = [];
  
  for (const debtData of debts) {
    try {
      const debt = await createDebt(debtData);
      results.push(debt);
    } catch (error) {
      console.error(`Failed to create debt:`, error);
      // Continue with other debts
    }
  }
  
  return results;
}

async function bulkUpdateDebts(updates: TDebtUpdateData[]): Promise<TDebt[]> {
  const results: TDebt[] = [];
  
  for (const updateData of updates) {
    try {
      const debt = await updateDebt(updateData);
      results.push(debt);
    } catch (error) {
      console.error(`Failed to update debt ${updateData.id}:`, error);
    }
  }
  
  return results;
}

async function bulkProcessPayments(payments: TPaymentCreateData[]): Promise<TPaymentResult[]> {
  const results: TPaymentResult[] = [];
  
  for (const paymentData of payments) {
    try {
      const result = await processPayment(paymentData.debtId, paymentData, false); // Don't create transactions in bulk
      results.push(result);
    } catch (error) {
      console.error(`Failed to process payment:`, error);
    }
  }
  
  return results;
}

async function bulkDeleteDebts(ids: number[], deletePayments: boolean = false): Promise<{ deleted: number[]; failed: number[] }> {
  const deleted: number[] = [];
  const failed: number[] = [];
  
  for (const id of ids) {
    try {
      const success = await deleteDebt(id, deletePayments);
      if (success) {
        deleted.push(id);
      } else {
        failed.push(id);
      }
    } catch (error) {
      console.error(`Failed to delete debt ${id}:`, error);
      failed.push(id);
    }
  }
  
  return { deleted, failed };
}

// Interest calculation and adjustment
async function calculateAccruedInterest(
  debtId: number,
  fromDate?: string,
  toDate?: string
): Promise<{ accruedInterest: number; days: number; dailyRate: number }> {
  const debt = await getDebtById(debtId);
  if (!debt) {
    throw new Error('Debt not found');
  }
  
  const startDate = new Date(fromDate || debt.lastPaymentDate || debt.originationDate);
  const endDate = new Date(toDate || new Date().toISOString().split('T')[0]);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days <= 0 || debt.interestRate === 0) {
    return { accruedInterest: 0, days, dailyRate: 0 };
  }
  
  const dailyRate = debt.interestRate / 100 / 365;
  let accruedInterest = 0;
  
  if (debt.interestType === 'simple') {
    accruedInterest = debt.remainingBalance * dailyRate * days;
  } else {
    // Compound interest
    const compoundFactor = Math.pow(1 + dailyRate, days);
    accruedInterest = debt.remainingBalance * (compoundFactor - 1);
  }
  
  return { accruedInterest, days, dailyRate };
}

export {
  createDebt,
  updateDebt,
  deleteDebt,
  processPayment,
  updatePayment,
  deletePayment,
  consolidateDebts,
  bulkCreateDebts,
  bulkUpdateDebts,
  bulkProcessPayments,
  bulkDeleteDebts,
  calculateAccruedInterest,
  calculatePaymentAllocation,
  TPaymentResult,
  TConsolidationResult,
  TPaymentAllocation
};
