import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { TCategory, TCreateCategoryInput } from '@/lib/types/categories';

function createTimestamps() {
  return {
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  };
}

function createEntity() {
  return {
    id: integer('id').primaryKey(),
    ...createTimestamps(),
  };
}

function createSyncableEntity() {
  return {
    ...createEntity(),
    synced: integer('synced', { mode: 'boolean' }).default(false),
  };
}

export const categoriesSchema = sqliteTable('categories', {
  ...createSyncableEntity(),
  name: text('name').notNull().unique(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('💰'),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false).notNull(),
});

type TCategoryInsert = typeof categoriesSchema.$inferInsert;
type TCategorySelect = typeof categoriesSchema.$inferSelect;

export type { TCategoryInsert, TCategorySelect };
