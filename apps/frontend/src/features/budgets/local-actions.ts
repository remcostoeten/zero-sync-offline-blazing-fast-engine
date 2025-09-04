'use client';

import { budgetsSchema, type TBudget, type TBudgetInsert } from '@/lib/database/schemas';
import { createLocalCrudFactory } from '@/lib/database/local-crud-factory';
import { createBudgetSchema, updateBudgetSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

const budgetsCrud = createLocalCrudFactory(budgetsSchema, 'budgets');

export async function createBudgetLocal(input: CreateBudgetInput): Promise<TBudget> {
  const validatedData = createBudgetSchema.parse(input);
  return await budgetsCrud.create(validatedData);
}

export async function getBudgetsLocal(): Promise<TBudget[]> {
  return await budgetsCrud.read();
}

export async function getBudgetByIdLocal(id: number): Promise<TBudget | null> {
  return await budgetsCrud.readById(id);
}

export async function updateBudgetLocal(input: UpdateBudgetInput): Promise<TBudget> {
  const validatedData = updateBudgetSchema.parse(input);
  const { id, ...updateData } = validatedData;
  
  if (!id) {
    throw new Error('Budget ID is required for update');
  }

  return await budgetsCrud.update(parseInt(id), updateData);
}

export async function deleteBudgetLocal(input: { id: string }): Promise<void> {
  await budgetsCrud.destroy(parseInt(input.id));
}

export async function getUnsyncedBudgetsLocal(): Promise<TBudget[]> {
  return await budgetsCrud.getUnsyncedRecords();
}

export async function syncAllBudgetsLocal(): Promise<{ success: number; failed: number }> {
  return await budgetsCrud.syncAllRecords();
}

export function getBudgetsSyncQueue() {
  return budgetsCrud.getSyncQueue();
}
