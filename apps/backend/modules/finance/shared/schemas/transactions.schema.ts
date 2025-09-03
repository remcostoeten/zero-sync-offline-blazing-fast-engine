import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';
import { categoriesSchema } from './categories.schema';

export const transactionsSchema = sqliteTable('transactions', {
  ...createSyncableEntity(),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  categoryId: integer('category_id').notNull().references(() => categoriesSchema.id),
  note: text('note'),
  date: text('date').notNull(),
});

export const transactionsRelations = relations(transactionsSchema, ({ one }) => ({
  category: one(categoriesSchema, {
    fields: [transactionsSchema.categoryId],
    references: [categoriesSchema.id],
  }),
}));

type TTransaction = TBaseEntity & {
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  note: string | null;
  date: string;
  synced: boolean;
};

type TTransactionInsert = Omit<TTransaction, 'id' | 'createdAt' | 'updatedAt'>;

type TTransactionSelect = TTransaction;

type TTransactionWithCategory = TTransaction & {
  category: {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
  };
};

export type { TTransaction, TTransactionInsert, TTransactionSelect, TTransactionWithCategory };
