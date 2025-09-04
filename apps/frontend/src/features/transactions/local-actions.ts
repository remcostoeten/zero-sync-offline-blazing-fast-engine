'use client';

import { transactionsSchema, type TTransaction, type TTransactionInsert } from '@/lib/database/schemas';
import { createLocalCrudFactory } from '@/lib/database/local-crud-factory';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

const transactionsCrud = createLocalCrudFactory(transactionsSchema, 'transactions');

export async function createTransactionLocal(input: CreateTransactionInput): Promise<TTransaction> {
  const validatedData = createTransactionSchema.parse(input);
  return await transactionsCrud.create(validatedData);
}

export async function getTransactionsLocal(): Promise<TTransaction[]> {
  return await transactionsCrud.read();
}

export async function getTransactionByIdLocal(id: number): Promise<TTransaction | null> {
  return await transactionsCrud.readById(id);
}

export async function updateTransactionLocal(input: UpdateTransactionInput): Promise<TTransaction> {
  const validatedData = updateTransactionSchema.parse(input);
  const { id, ...updateData } = validatedData;
  
  if (!id) {
    throw new Error('Transaction ID is required for update');
  }

  return await transactionsCrud.update(parseInt(id), updateData);
}

export async function deleteTransactionLocal(input: { id: string }): Promise<void> {
  await transactionsCrud.destroy(parseInt(input.id));
}

export async function getUnsyncedTransactionsLocal(): Promise<TTransaction[]> {
  return await transactionsCrud.getUnsyncedRecords();
}

export async function syncAllTransactionsLocal(): Promise<{ success: number; failed: number }> {
  return await transactionsCrud.syncAllRecords();
}

export function getTransactionsSyncQueue() {
  return transactionsCrud.getSyncQueue();
}
