import { getLocalClient } from './local-client';
import { eq, and, sql } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

// Types for optimistic updates
export type TOptimisticOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, any>;
  originalData?: Record<string, any>; // For rollback
  timestamp: Date;
  synced: boolean;
  retryCount: number;
};

// Queue for pending operations
class SyncQueue {
  private operations: TOptimisticOperation[] = [];
  private maxRetries = 3;

  addOperation(operation: Omit<TOptimisticOperation, 'id' | 'timestamp' | 'synced' | 'retryCount'>): string {
    const id = crypto.randomUUID();
    const fullOperation: TOptimisticOperation = {
      ...operation,
      id,
      timestamp: new Date(),
      synced: false,
      retryCount: 0,
    };

    this.operations.push(fullOperation);
    this.saveToLocalStorage();
    
    return id;
  }

  removeOperation(id: string): void {
    this.operations = this.operations.filter(op => op.id !== id);
    this.saveToLocalStorage();
  }

  getPendingOperations(): TOptimisticOperation[] {
    return this.operations.filter(op => !op.synced);
  }

  markAsSynced(id: string): void {
    const operation = this.operations.find(op => op.id === id);
    if (operation) {
      operation.synced = true;
      this.saveToLocalStorage();
    }
  }

  incrementRetry(id: string): boolean {
    const operation = this.operations.find(op => op.id === id);
    if (operation) {
      operation.retryCount++;
      this.saveToLocalStorage();
      return operation.retryCount <= this.maxRetries;
    }
    return false;
  }

  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance-sync-queue', JSON.stringify(this.operations));
    }
  }

  loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('finance-sync-queue');
      if (stored) {
        try {
          this.operations = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to load sync queue from localStorage:', error);
          this.operations = [];
        }
      }
    }
  }

  clear(): void {
    this.operations = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finance-sync-queue');
    }
  }
}

// Global sync queue instance
const syncQueue = new SyncQueue();

// Enhanced CRUD factory with local-first capabilities
export function createLocalCrudFactory<
  TTable extends SQLiteTable,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert']
>(
  table: TTable,
  tableName: string
) {
  function getDb() {
    return getLocalClient().getDb();
  }

  function getClient() {
    return getLocalClient();
  }

  // Create with optimistic update
  async function create(data: TInsert): Promise<TSelect> {
    const db = getDb();
    const client = getClient();

    try {
      // Optimistically insert into local database
      const result = await db.insert(table).values({
        ...data,
        synced: false, // Mark as not synced
      } as any).returning();

      const created = result[0] as TSelect;

      // Add to sync queue
      const operationId = syncQueue.addOperation({
        type: 'create',
        table: tableName,
        data: created,
      });

      // Attempt sync in background
      client.syncWithRemote().then(success => {
        if (success) {
          syncQueue.markAsSynced(operationId);
          // Update synced status in local db
          db.update(table)
            .set({ synced: true } as any)
            .where(eq((table as any).id, (created as any).id))
            .run();
        }
      }).catch(error => {
        console.error('Background sync failed:', error);
      });

      return created;

    } catch (error) {
      console.error('Local create failed:', error);
      throw error;
    }
  }

  // Read (always from local first)
  async function read(): Promise<TSelect[]> {
    const db = getDb();
    return await db.select().from(table).orderBy(sql`created_at DESC`);
  }

  // Read by ID
  async function readById(id: number): Promise<TSelect | null> {
    const db = getDb();
    const result = await db.select().from(table).where(eq((table as any).id, id)).limit(1);
    return result[0] || null;
  }

  // Update with optimistic update
  async function update(id: number, data: Partial<TInsert>): Promise<TSelect> {
    const db = getDb();
    const client = getClient();

    try {
      // Get original data for rollback
      const original = await readById(id);
      if (!original) {
        throw new Error(`Record with id ${id} not found`);
      }

      // Optimistically update local database
      const result = await db.update(table)
        .set({
          ...data,
          synced: false,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        } as any)
        .where(eq((table as any).id, id))
        .returning();

      const updated = result[0] as TSelect;

      // Add to sync queue
      const operationId = syncQueue.addOperation({
        type: 'update',
        table: tableName,
        data: updated,
        originalData: original,
      });

      // Attempt sync in background
      client.syncWithRemote().then(success => {
        if (success) {
          syncQueue.markAsSynced(operationId);
          // Update synced status in local db
          db.update(table)
            .set({ synced: true } as any)
            .where(eq((table as any).id, id))
            .run();
        }
      }).catch(error => {
        console.error('Background sync failed:', error);
      });

      return updated;

    } catch (error) {
      console.error('Local update failed:', error);
      throw error;
    }
  }

  // Delete with optimistic update
  async function destroy(id: number): Promise<void> {
    const db = getDb();
    const client = getClient();

    try {
      // Get original data for rollback
      const original = await readById(id);
      if (!original) {
        throw new Error(`Record with id ${id} not found`);
      }

      // Optimistically delete from local database
      await db.delete(table).where(eq((table as any).id, id));

      // Add to sync queue
      const operationId = syncQueue.addOperation({
        type: 'delete',
        table: tableName,
        data: { id },
        originalData: original,
      });

      // Attempt sync in background
      client.syncWithRemote().then(success => {
        if (success) {
          syncQueue.markAsSynced(operationId);
        }
      }).catch(error => {
        console.error('Background sync failed:', error);
        // If sync fails, we might want to restore the record
        // This would require more sophisticated conflict resolution
      });

    } catch (error) {
      console.error('Local delete failed:', error);
      throw error;
    }
  }

  // Get unsynced records
  async function getUnsyncedRecords(): Promise<TSelect[]> {
    const db = getDb();
    return await db.select().from(table).where(eq((table as any).synced, false));
  }

  // Force sync all unsynced records
  async function syncAllRecords(): Promise<{ success: number; failed: number }> {
    const client = getClient();
    let success = 0;
    let failed = 0;

    try {
      // Attempt to sync with remote
      const syncSuccess = await client.syncWithRemote();
      
      if (syncSuccess) {
        // Mark all records as synced
        const db = getDb();
        await db.update(table).set({ synced: true } as any);
        
        // Get count of previously unsynced records
        const unsynced = await getUnsyncedRecords();
        success = unsynced.length;
      } else {
        const unsynced = await getUnsyncedRecords();
        failed = unsynced.length;
      }
    } catch (error) {
      console.error('Sync all records failed:', error);
      const unsynced = await getUnsyncedRecords();
      failed = unsynced.length;
    }

    return { success, failed };
  }

  // Rollback a failed operation
  async function rollbackOperation(operationId: string): Promise<boolean> {
    const operations = syncQueue.getPendingOperations();
    const operation = operations.find(op => op.id === operationId);
    
    if (!operation || !operation.originalData) {
      return false;
    }

    const db = getDb();

    try {
      switch (operation.type) {
        case 'create':
          // Remove the optimistically created record
          await db.delete(table).where(eq((table as any).id, (operation.data as any).id));
          break;
          
        case 'update':
          // Restore original data
          await db.update(table)
            .set(operation.originalData as any)
            .where(eq((table as any).id, (operation.data as any).id));
          break;
          
        case 'delete':
          // Restore deleted record
          await db.insert(table).values(operation.originalData as any);
          break;
      }

      syncQueue.removeOperation(operationId);
      return true;

    } catch (error) {
      console.error('Rollback operation failed:', error);
      return false;
    }
  }

  return {
    create,
    read,
    readById,
    update,
    destroy,
    getUnsyncedRecords,
    syncAllRecords,
    rollbackOperation,
    
    // Expose sync queue for advanced usage
    getSyncQueue: () => syncQueue,
  };
}

// Export the sync queue for global management
export { syncQueue };

// Helper function to initialize sync queue from localStorage
export function initializeSyncQueue(): void {
  if (typeof window !== 'undefined') {
    syncQueue.loadFromLocalStorage();
  }
}

// Helper function to process pending sync operations
export async function processPendingSyncOperations(): Promise<void> {
  const client = getLocalClient();
  const pending = syncQueue.getPendingOperations();
  
  if (pending.length === 0) return;

  try {
    const syncSuccess = await client.syncWithRemote();
    if (syncSuccess) {
      // Mark all pending operations as synced
      pending.forEach(op => {
        syncQueue.markAsSynced(op.id);
      });
    }
  } catch (error) {
    console.error('Failed to process pending sync operations:', error);
  }
}
