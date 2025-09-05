'use client';

import { getLocalClient } from './local-client';
import { syncQueue } from './local-crud-factory';
import {
  syncAllCategoriesLocal,
  getUnsyncedCategoriesLocal,
} from '@/features/categories/local-actions';
import {
  syncAllTransactionsLocal,
  getUnsyncedTransactionsLocal,
} from '@/features/transactions/local-actions';
import {
  syncAllBudgetsLocal,
  getUnsyncedBudgetsLocal,
} from '@/features/budgets/local-actions';

export type TSyncResult = {
  success: number;
  failed: number;
  errors: Error[];
};

export type TSyncStats = {
  totalPending: number;
  totalSynced: number;
  totalFailed: number;
  entitiesStatus: Record<string, { pending: number; synced: number; failed: number }>;
};

export type TSyncOptions = {
  priority?: 'high' | 'normal' | 'low';
  batchSize?: number;
  retryFailedOnly?: boolean;
  entities?: string[];
};

function createSyncOrchestrator() {
  let isSyncing = false;
  let syncPromise: Promise<TSyncResult> | null = null;
  const eventListeners: Array<(event: { type: string; data: any }) => void> = [];

  const defaultOptions: Required<TSyncOptions> = {
    priority: 'normal',
    batchSize: 10,
    retryFailedOnly: false,
    entities: ['categories', 'transactions', 'budgets'],
  };

  function setupAutoSync() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !isSyncing) {
          syncAll({ priority: 'low' }).catch(console.error);
        }
      });

      window.addEventListener('online', () => {
        if (!isSyncing) {
          syncAll({ priority: 'high' }).catch(console.error);
        }
      });
    }
  }

  async function syncAll(options: TSyncOptions = {}): Promise<TSyncResult> {
    if (isSyncing && syncPromise) {
      return syncPromise;
    }

    const finalOptions = { ...defaultOptions, ...options };
    
    isSyncing = true;
    emitEvent('sync-start', { options: finalOptions });

    syncPromise = performSync(finalOptions);
    
    try {
      const result = await syncPromise;
      emitEvent('sync-complete', result);
      return result;
    } catch (error) {
      emitEvent('sync-error', { error });
      throw error;
    } finally {
      isSyncing = false;
      syncPromise = null;
    }
  }

  async function performSync(options: Required<TSyncOptions>): Promise<TSyncResult> {
    const client = getLocalClient();
    
    if (!client.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    const results: TSyncResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const entity of options.entities) {
      try {
        emitEvent('entity-sync-start', { entity });
        
        let entityResult: { success: number; failed: number };

        switch (entity) {
          case 'categories':
            entityResult = await syncAllCategoriesLocal();
            break;
          case 'transactions':
            entityResult = await syncAllTransactionsLocal();
            break;
          case 'budgets':
            entityResult = await syncAllBudgetsLocal();
            break;
          default:
            console.warn(`Unknown entity type: ${entity}`);
            continue;
        }

        results.success += entityResult.success;
        results.failed += entityResult.failed;

        emitEvent('entity-sync-complete', { 
          entity, 
          result: entityResult 
        });

      } catch (error) {
        console.error(`Failed to sync ${entity}:`, error);
        results.errors.push(error as Error);
        results.failed++;

        emitEvent('entity-sync-error', { 
          entity, 
          error 
        });
      }
    }

    return results;
  }

  async function getSyncStats(): Promise<TSyncStats> {
    const stats: TSyncStats = {
      totalPending: 0,
      totalSynced: 0,
      totalFailed: 0,
      entitiesStatus: {}
    };

    try {
      const pendingOps = syncQueue.getPendingOperations();
      stats.totalPending = pendingOps.length;

      const [
        unsyncedCategories,
        unsyncedTransactions,  
        unsyncedBudgets,
      ] = await Promise.all([
        getUnsyncedCategoriesLocal(),
        getUnsyncedTransactionsLocal(),
        getUnsyncedBudgetsLocal(),
      ]);

      stats.entitiesStatus = {
        categories: {
          pending: unsyncedCategories.length,
          synced: 0,
          failed: 0
        },
        transactions: {
          pending: unsyncedTransactions.length,
          synced: 0,
          failed: 0
        },
        budgets: {
          pending: unsyncedBudgets.length,
          synced: 0,
          failed: 0
        }
      };

    } catch (error) {
      console.error('Failed to get sync stats:', error);
    }

    return stats;
  }

  async function forceSyncEntity(entity: string): Promise<TSyncResult> {
    return syncAll({ 
      entities: [entity],
      priority: 'high'
    });
  }

  async function retryFailedOperations(): Promise<TSyncResult> {
    return syncAll({
      retryFailedOnly: true,
      priority: 'high'
    });
  }

  async function batchSync(
    operations: Array<() => Promise<any>>,
    batchSize = 5
  ): Promise<TSyncResult> {
    const results: TSyncResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.allSettled(
          batch.map(op => op())
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(new Error(`Batch operation ${i + index} failed: ${result.reason}`));
          }
        });

        if (i + batchSize < operations.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Batch ${i}-${i + batchSize} failed:`, error);
        results.failed += batch.length;
        results.errors.push(error as Error);
      }
    }

    return results;
  }

  function addEventListener(callback: (event: { type: string; data: any }) => void): () => void {
    eventListeners.push(callback);
    
    return () => {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  function emitEvent(type: string, data: any): void {
    eventListeners.forEach(callback => {
      try {
        callback({ type, data });
      } catch (error) {
        console.error('Sync orchestrator event listener error:', error);
      }
    });
  }

  function getSyncStatus(): { 
    isSyncing: boolean;
    hasActiveSyncPromise: boolean;
  } {
    return {
      isSyncing,
      hasActiveSyncPromise: syncPromise !== null,
    };
  }

    async function prioritySync(entity: string): Promise<TSyncResult> {
    return forceSyncEntity(entity);
  }

  function cleanup(): void {
    eventListeners.length = 0;
    if (syncPromise) {
      syncPromise = null;
    }
    isSyncing = false;
  }

  setupAutoSync();

  return {
    syncAll,
    getSyncStats,
    forceSyncEntity,
    retryFailedOperations,
    batchSync,
    addEventListener,
    getSyncStatus,
    prioritySync,
    cleanup,
  };
}

let syncOrchestratorInstance: ReturnType<typeof createSyncOrchestrator> | null = null;

export function getSyncOrchestrator() {
  if (!syncOrchestratorInstance) {
    syncOrchestratorInstance = createSyncOrchestrator();
  }
  return syncOrchestratorInstance;
}
