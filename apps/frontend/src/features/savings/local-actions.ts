'use client';

import { savingsGoalsSchema, type TSavingsGoal, type TSavingsGoalInsert } from '@/lib/database/schemas';
import { createLocalCrudFactory } from '@/lib/database/local-crud-factory';
import { createSavingsGoalSchema, updateSavingsGoalSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;

const savingsGoalsCrud = createLocalCrudFactory(savingsGoalsSchema, 'savings_goals');

export async function createSavingsGoalLocal(input: CreateSavingsGoalInput): Promise<TSavingsGoal> {
  const validatedData = createSavingsGoalSchema.parse(input);
  return await savingsGoalsCrud.create(validatedData);
}

export async function getSavingsGoalsLocal(): Promise<TSavingsGoal[]> {
  return await savingsGoalsCrud.read();
}

export async function getSavingsGoalByIdLocal(id: number): Promise<TSavingsGoal | null> {
  return await savingsGoalsCrud.readById(id);
}

export async function updateSavingsGoalLocal(input: UpdateSavingsGoalInput): Promise<TSavingsGoal> {
  const validatedData = updateSavingsGoalSchema.parse(input);
  const { id, ...updateData } = validatedData;
  
  if (!id) {
    throw new Error('Savings Goal ID is required for update');
  }

  return await savingsGoalsCrud.update(parseInt(id), updateData);
}

export async function deleteSavingsGoalLocal(input: { id: string }): Promise<void> {
  await savingsGoalsCrud.destroy(parseInt(input.id));
}

export async function getUnsyncedSavingsGoalsLocal(): Promise<TSavingsGoal[]> {
  return await savingsGoalsCrud.getUnsyncedRecords();
}

export async function syncAllSavingsGoalsLocal(): Promise<{ success: number; failed: number }> {
  return await savingsGoalsCrud.syncAllRecords();
}

export function getSavingsGoalsSyncQueue() {
  return savingsGoalsCrud.getSyncQueue();
}
