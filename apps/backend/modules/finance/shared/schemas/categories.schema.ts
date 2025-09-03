import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const categoriesSchema = sqliteTable('categories', {
  ...createSyncableEntity(),
  name: text('name').notNull().unique(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('💰'),
});

type TCategory = TBaseEntity & {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  synced: boolean;
};

type TCategoryInsert = Omit<TCategory, 'id' | 'createdAt' | 'updatedAt'>;

type TCategorySelect = TCategory;

export type { TCategory, TCategoryInsert, TCategorySelect };
