import { createCrudFactory, createDb } from '../../../../shared';
import { transactionsSchema, TTransactionInsert, TTransactionSelect } from '../../../../shared/schemas';

const transactionCrud = createCrudFactory<typeof transactionsSchema, TTransactionInsert, TTransactionSelect>(transactionsSchema)();

type TTransactionCreateData = Omit<TTransactionInsert, 'synced' | 'isDemo'>;

async function createTransaction(data: TTransactionCreateData) {
  const transactionData: TTransactionInsert = {
    ...data,
    date: data.date || new Date().toISOString().split('T')[0],
    synced: false,
    isDemo: false
  };

  return transactionCrud.create(transactionData);
}

async function updateTransaction(id: number, data: Partial<TTransactionInsert>) {
  return transactionCrud.update(id, data);
}

async function deleteTransaction(id: number) {
  return transactionCrud.destroy(id);
}

async function bulkImportTransactions(transactions: TTransactionCreateData[]) {
  const db = createDb();
  
  const transactionsWithDefaults: TTransactionInsert[] = transactions.map(transaction => ({
    ...transaction,
    date: transaction.date || new Date().toISOString().split('T')[0],
    synced: false,
    isDemo: false
  }));

  const results = await db
    .insert(transactionsSchema)
    .values(transactionsWithDefaults)
    .returning();

  return {
    success: true,
    imported: results.length,
    transactions: results
  };
}

export { 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  bulkImportTransactions 
};
