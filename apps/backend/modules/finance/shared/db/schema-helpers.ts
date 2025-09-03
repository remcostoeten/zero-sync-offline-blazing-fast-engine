import { integer } from 'drizzle-orm/sqlite-core';

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

export { createTimestamps, createEntity, createSyncableEntity };
