'use client';

import { categoriesSchema, type TCategory, type TCategoryInsert } from '@/lib/database/schemas';
import { createLocalCrudFactory } from '@/lib/database/local-crud-factory';
import { createCategorySchema, updateCategorySchema } from '@/lib/validation/schemas';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Create the local CRUD factory for categories
const categoriesCrud = createLocalCrudFactory(categoriesSchema, 'categories');

// Create a new category (local-first with optimistic updates)
export async function createCategoryLocal(input: CreateCategoryInput): Promise<TCategory> {
  const validatedData = createCategorySchema.parse(input);
  
  // This will:
  // 1. Save to local SQLite immediately
  // 2. Add to sync queue  
  // 3. Attempt background sync
  // 4. Return the created record instantly
  return await categoriesCrud.create(validatedData);
}

// Get all categories (always from local database)
export async function getCategoriesLocal(): Promise<TCategory[]> {
  return await categoriesCrud.read();
}

// Get category by ID (from local database)
export async function getCategoryByIdLocal(id: number): Promise<TCategory | null> {
  return await categoriesCrud.readById(id);
}

// Update a category (local-first with optimistic updates)
export async function updateCategoryLocal(input: UpdateCategoryInput): Promise<TCategory> {
  const validatedData = updateCategorySchema.parse(input);
  const { id, ...updateData } = validatedData;
  
  if (!id) {
    throw new Error('Category ID is required for update');
  }

  // This will:
  // 1. Update local SQLite immediately
  // 2. Store original data for rollback
  // 3. Add to sync queue
  // 4. Attempt background sync
  return await categoriesCrud.update(parseInt(id), updateData);
}

// Delete a category (local-first with optimistic updates)
export async function deleteCategoryLocal(input: { id: string }): Promise<void> {
  // This will:
  // 1. Delete from local SQLite immediately  
  // 2. Store original data for rollback
  // 3. Add to sync queue
  // 4. Attempt background sync
  await categoriesCrud.destroy(parseInt(input.id));
}

// Get categories with enhanced analytics (local-first)
export async function getCategoriesWithAnalyticsLocal(filters?: {
  type?: 'income' | 'expense' | 'debt' | 'investment' | 'savings';
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TCategory[]> {
  const allCategories = await getCategoriesLocal();
  
  // Apply filters
  let filteredCategories = allCategories;
  
  if (filters?.type) {
    filteredCategories = filteredCategories.filter(cat => cat.type === filters.type);
  }
  
  if (filters?.isActive !== undefined) {
    filteredCategories = filteredCategories.filter(cat => cat.isActive === filters.isActive);
  }
  
  return filteredCategories;
}

// Get categories by type (local-first)
export async function getCategoriesByTypeLocal(type: 'income' | 'expense' | 'debt' | 'investment' | 'savings'): Promise<TCategory[]> {
  const allCategories = await getCategoriesLocal();
  return allCategories.filter(cat => cat.type === type && cat.isActive);
}

// Get active categories only (local-first)
export async function getActiveCategoriesLocal(): Promise<TCategory[]> {
  const allCategories = await getCategoriesLocal();
  return allCategories.filter(cat => cat.isActive);
}

// Get unsynced categories (local-only)
export async function getUnsyncedCategoriesLocal(): Promise<TCategory[]> {
  return await categoriesCrud.getUnsyncedRecords();
}

// Force sync all categories
export async function syncAllCategoriesLocal(): Promise<{ success: number; failed: number }> {
  return await categoriesCrud.syncAllRecords();
}

// Bulk update category status (local-first)
export async function bulkUpdateCategoryStatusLocal(input: {
  ids: string[];
  isActive: boolean;
}): Promise<void> {
  // Update each category individually
  // In a more sophisticated implementation, we could batch these
  await Promise.all(
    input.ids.map(async (id) => {
      await updateCategoryLocal({
        id,
        isActive: input.isActive
      });
    })
  );
}

// Get category usage statistics (local-first)
export async function getCategoryUsageStatsLocal() {
  const allCategories = await getCategoriesLocal();
  
  const stats = {
    totalCategories: allCategories.length,
    activeCategories: allCategories.filter(cat => cat.isActive).length,
    incomeCategories: allCategories.filter(cat => cat.type === 'income').length,
    expenseCategories: allCategories.filter(cat => cat.type === 'expense').length,
    categoriesWithBudgets: allCategories.filter(cat => 
      cat.monthlyBudgetLimit !== null && (cat.monthlyBudgetLimit || 0) > 0
    ).length,
  };
  
  return stats;
}

// Rollback a failed category operation
export async function rollbackCategoryOperationLocal(operationId: string): Promise<boolean> {
  return await categoriesCrud.rollbackOperation(operationId);
}

// Get sync status for categories
export function getCategoriesSyncQueue() {
  return categoriesCrud.getSyncQueue();
}
