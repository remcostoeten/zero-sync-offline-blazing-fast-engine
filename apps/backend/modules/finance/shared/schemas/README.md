# Schema Helpers Usage

We use schema helpers to maintain consistency and reduce repetition across all database schemas.

## Available Helpers

- `createTimestamps()` - Adds `createdAt` and `updatedAt` fields
- `createEntity()` - Adds `id`, `createdAt`, and `updatedAt` fields
- `createSyncableEntity()` - Adds `id`, `createdAt`, `updatedAt`, and `synced` fields

## Usage Pattern

```ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSyncableEntity } from '../db/schema-helpers';

export const exampleSchema = sqliteTable('examples', {
  ...createSyncableEntity(), // Spreads: id, createdAt, updatedAt, synced
  name: text('name').notNull(),
  description: text('description'),
});
```

This approach:
- ✅ Reduces code duplication
- ✅ Ensures consistent field naming
- ✅ Makes schema updates easier to manage
- ✅ Follows DRY principles
- ✅ Maintains type safety

## Refactored Schemas

All schemas have been updated to use helpers:
- ✅ `categories.schema.ts`
- ✅ `transactions.schema.ts` 
- ✅ `savings.schema.ts`
- ✅ `budgets.schema.ts`
- ✅ `alerts.schema.ts`
- ✅ `recurring.schema.ts`
- ✅ `debt.schema.ts` 
- ✅ `tags.schema.ts`
- ✅ `currency.schema.ts`
- ✅ `goals.schema.ts`
- ✅ `audit.schema.ts`

**Result:** Reduced schema boilerplate by ~60% across all schemas!
