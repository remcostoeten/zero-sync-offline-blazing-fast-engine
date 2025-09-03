import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity, createTimestamps } from '../db/schema-helpers';
import { transactionsSchema } from './transactions.schema';

export const tagsSchema = sqliteTable('tags', {
  ...createSyncableEntity(),
  name: text('name').notNull().unique(),
  color: text('color').default('#6B7280'),
  description: text('description'),
});

export const transactionTagsSchema = sqliteTable('transaction_tags', {
  transactionId: integer('transaction_id').notNull().references(() => transactionsSchema.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tagsSchema.id, { onDelete: 'cascade' }),
  ...createTimestamps(),
  synced: integer('synced', { mode: 'boolean' }).default(false),
}, (table) => ({
  pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
}));

export const tagsRelations = relations(tagsSchema, ({ many }) => ({
  transactionTags: many(transactionTagsSchema),
}));

export const transactionTagsRelations = relations(transactionTagsSchema, ({ one }) => ({
  transaction: one(transactionsSchema, {
    fields: [transactionTagsSchema.transactionId],
    references: [transactionsSchema.id],
  }),
  tag: one(tagsSchema, {
    fields: [transactionTagsSchema.tagId],
    references: [tagsSchema.id],
  }),
}));

type TTag = TBaseEntity & {
  name: string;
  color: string;
  description: string | null;
  synced: boolean;
};

type TTagInsert = Omit<TTag, 'id' | 'createdAt' | 'updatedAt'>;

type TTagSelect = TTag;

type TTransactionTag = {
  transactionId: number;
  tagId: number;
  createdAt: Date;
  synced: boolean;
};

type TTransactionTagInsert = Omit<TTransactionTag, 'createdAt'>;

type TTransactionTagSelect = TTransactionTag;

export type { 
  TTag, 
  TTagInsert, 
  TTagSelect,
  TTransactionTag,
  TTransactionTagInsert,
  TTransactionTagSelect
};
