import { createCrudFactory, createDb } from '../../../../shared';
import { 
  savingsGoalsSchema, 
  savingsTransactionsSchema,
  TSavingsGoalInsert, 
  TSavingsGoalSelect,
  TSavingsTransactionInsert,
  TSavingsTransactionSelect
} from '../../../../shared/schemas';
import { calculateSavingsProgress } from '../queries';
import { eq } from 'drizzle-orm';

const savingsGoalCrud = createCrudFactory<typeof savingsGoalsSchema, TSavingsGoalInsert, TSavingsGoalSelect>(savingsGoalsSchema)();
const savingsTransactionCrud = createCrudFactory<typeof savingsTransactionsSchema, TSavingsTransactionInsert, TSavingsTransactionSelect>(savingsTransactionsSchema)();

async function createSavingsGoal(data: TSavingsGoalInsert) {
  const goalData = {
    ...data,
    currentAmount: 0,
    color: data.color || '#10B981',
    icon: data.icon || '🎯',
    synced: false
  };

  return savingsGoalCrud.create(goalData);
}

async function updateSavingsGoal(id: number, data: Partial<TSavingsGoalInsert>) {
  return savingsGoalCrud.update(id, data);
}

async function deleteSavingsGoal(id: number) {
  const db = createDb();
  
  // First check if there are any transactions for this goal
  const transactions = await db
    .select()
    .from(savingsTransactionsSchema)
    .where(eq(savingsTransactionsSchema.savingsGoalId, id))
    .limit(1);
  
  if (transactions.length > 0) {
    throw new Error('Cannot delete savings goal with existing transactions. Delete transactions first.');
  }
  
  return savingsGoalCrud.destroy(id);
}

async function addSavingsTransaction(data: TSavingsTransactionInsert) {
  const db = createDb();
  
  const transactionData = {
    ...data,
    date: data.date || new Date().toISOString().split('T')[0],
    synced: false
  };

  // Verify the goal exists
  const goal = await savingsGoalCrud.read(data.savingsGoalId);
  if (!goal) {
    throw new Error('Savings goal not found');
  }

  // Create the transaction
  const transaction = await savingsTransactionCrud.create(transactionData);
  
  // Update the goal's current amount
  const progressStats = await calculateSavingsProgress(data.savingsGoalId);
  await savingsGoalCrud.update(data.savingsGoalId, {
    currentAmount: progressStats.netContribution
  });

  return transaction;
}

async function withdrawFromSavings(goalId: number, amount: number, note?: string, date?: string) {
  const goal = await savingsGoalCrud.read(goalId);
  if (!goal) {
    throw new Error('Savings goal not found');
  }
  
  const progressStats = await calculateSavingsProgress(goalId);
  if (amount > progressStats.netContribution) {
    throw new Error(`Insufficient funds. Available: $${progressStats.netContribution.toFixed(2)}, Requested: $${amount.toFixed(2)}`);
  }
  
  return addSavingsTransaction({
    savingsGoalId: goalId,
    amount,
    type: 'withdrawal',
    note: note || `Withdrawal from ${goal.name}`,
    date: date || new Date().toISOString().split('T')[0],
    synced: false
  });
}

async function updateSavingsTransaction(id: number, data: Partial<TSavingsTransactionInsert>) {
  const db = createDb();
  
  // Get the current transaction to check the goal
  const currentTransaction = await savingsTransactionCrud.read(id);
  if (!currentTransaction) {
    throw new Error('Savings transaction not found');
  }
  
  // Update the transaction
  const updatedTransaction = await savingsTransactionCrud.update(id, data);
  
  if (updatedTransaction) {
    // Recalculate and update goal's current amount
    const progressStats = await calculateSavingsProgress(currentTransaction.savingsGoalId);
    await savingsGoalCrud.update(currentTransaction.savingsGoalId, {
      currentAmount: progressStats.netContribution
    });
  }
  
  return updatedTransaction;
}

async function deleteSavingsTransaction(id: number) {
  const db = createDb();
  
  // Get the transaction to know which goal to update
  const transaction = await savingsTransactionCrud.read(id);
  if (!transaction) {
    return false;
  }
  
  const goalId = transaction.savingsGoalId;
  
  // Delete the transaction
  const deleted = await savingsTransactionCrud.destroy(id);
  
  if (deleted) {
    // Recalculate and update goal's current amount
    const progressStats = await calculateSavingsProgress(goalId);
    await savingsGoalCrud.update(goalId, {
      currentAmount: progressStats.netContribution
    });
  }
  
  return deleted;
}

export { 
  createSavingsGoal, 
  updateSavingsGoal, 
  deleteSavingsGoal,
  addSavingsTransaction,
  withdrawFromSavings,
  updateSavingsTransaction,
  deleteSavingsTransaction
};
