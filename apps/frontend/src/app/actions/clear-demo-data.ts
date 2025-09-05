'use server';

import { getDb } from '@/lib/database/connection';
import { 
  categoriesSchema, 
  transactionsSchema, 
  budgetsSchema, 
  savingsGoalsSchema, 
  savingsTransactionsSchema, 
  recurringTransactionsSchema 
} from '@/lib/database/schemas';
import { revalidatePath } from 'next/cache';

type TResponse = {
  success: boolean;
  message: string;
  clearedTables?: string[];
  error?: string;
};

export async function clearAllDemoData(): Promise<TResponse> {
  try {
    const db = getDb();
    const clearedTables: string[] = [];

    console.log('🧹 Starting database cleanup...');

    // Clear tables in order to respect foreign key constraints
    // Clear dependent tables first
    const tables = [
      { schema: savingsTransactionsSchema, name: 'savings_transactions' },
      { schema: transactionsSchema, name: 'transactions' },
      { schema: budgetsSchema, name: 'budgets' },
      { schema: recurringTransactionsSchema, name: 'recurring_transactions' },
      { schema: savingsGoalsSchema, name: 'savings_goals' },
      { schema: categoriesSchema, name: 'categories' }
    ];
    
    for (const table of tables) {
      try {
        await db.delete(table.schema);
        clearedTables.push(table.name);
        console.log(`✅ Cleared ${table.name}`);
      } catch (error: any) {
        if (error.message?.includes('no such table')) {
          console.log(`ℹ️ Table ${table.name} doesn't exist, skipping...`);
        } else {
          console.warn(`⚠️ Error clearing ${table.name}:`, error.message);
          // Continue with other tables instead of failing completely
        }
      }
    }

    // Revalidate all relevant paths
    revalidatePath('/');
    revalidatePath('/budgets');
    revalidatePath('/transactions');
    revalidatePath('/categories');
    revalidatePath('/savings');

    console.log('🎉 Database cleanup completed successfully');

    return {
      success: true,
      message: `Successfully cleared all demo data from ${clearedTables.length} tables`,
      clearedTables
    };

  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    
    return {
      success: false,
      message: 'Failed to clear demo data',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
