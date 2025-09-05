import { createCrudFactory, createDb } from '../../../../shared';
import { transactionsSchema, TTransactionInsert, TTransactionSelect, categoriesSchema } from '../../../../shared/schemas';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const transactionCrud = createCrudFactory<typeof transactionsSchema, TTransactionInsert, TTransactionSelect>(transactionsSchema)();

type TTransactionFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: 'income' | 'expense';
  limit?: number;
  offset?: number;
};

async function getTransactions(filters: TTransactionFilters = {}) {
  const db = createDb();
  
  let query = db
    .select({
      id: transactionsSchema.id,
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      categoryId: transactionsSchema.categoryId,
      note: transactionsSchema.note,
      date: transactionsSchema.date,
      createdAt: transactionsSchema.createdAt,
      updatedAt: transactionsSchema.updatedAt,
      synced: transactionsSchema.synced,
      categoryName: categoriesSchema.name,
      categoryColor: categoriesSchema.color,
      categoryIcon: categoriesSchema.icon
    })
    .from(transactionsSchema)
    .innerJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id));

  const conditions = [];
  
  if (filters.startDate) {
    conditions.push(gte(transactionsSchema.date, filters.startDate));
  }
  
  if (filters.endDate) {
    conditions.push(lte(transactionsSchema.date, filters.endDate));
  }
  
  if (filters.categoryId) {
    conditions.push(eq(transactionsSchema.categoryId, filters.categoryId));
  }
  
  if (filters.type) {
    conditions.push(eq(transactionsSchema.type, filters.type));
  }

  // Execute query with all chaining in one expression
  return conditions.length > 0
    ? query
        .where(and(...conditions))
        .orderBy(desc(transactionsSchema.date), desc(transactionsSchema.createdAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
    : query
        .orderBy(desc(transactionsSchema.date), desc(transactionsSchema.createdAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);
}

async function getTransactionById(id: number) {
  const db = createDb();
  
  const result = await db
    .select({
      id: transactionsSchema.id,
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      categoryId: transactionsSchema.categoryId,
      note: transactionsSchema.note,
      date: transactionsSchema.date,
      createdAt: transactionsSchema.createdAt,
      updatedAt: transactionsSchema.updatedAt,
      synced: transactionsSchema.synced,
      category: {
        id: categoriesSchema.id,
        name: categoriesSchema.name,
        type: categoriesSchema.type,
        color: categoriesSchema.color,
        icon: categoriesSchema.icon
      }
    })
    .from(transactionsSchema)
    .innerJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(eq(transactionsSchema.id, id))
    .limit(1);

  return result[0] || null;
}

async function getTransactionsByCategory(categoryId: number, limit = 50, offset = 0) {
  return getTransactions({ categoryId, limit, offset });
}

async function getTransactionsByDateRange(startDate: string, endDate: string, limit = 100, offset = 0) {
  return getTransactions({ startDate, endDate, limit, offset });
}

export { 
  getTransactions, 
  getTransactionById, 
  getTransactionsByCategory, 
  getTransactionsByDateRange 
};
