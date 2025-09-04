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

class SyncOrchestrator {
  private isSyncing = false;
  private syncPromise: Promise<TSyncResult> | null = null;
  private eventListeners: Array<(event: { type: string; data: any }) => void> = [];

  // Default sync options
  private defaultOptions: Required<TSyncOptions> = {
    priority: 'normal',
    batchSize: 10,
    retryFailedOnly: false,
    entities: ['categories', 'transactions', 'budgets'],
  };

  constructor() {
    this.setupAutoSync();
  }

  private setupAutoSync() {
    // Auto-sync on visibility change (when user returns to tab)
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !this.isSyncing) {
          this.syncAll({ priority: 'low' }).catch(console.error);
        }
      });

      // Auto-sync on network reconnection
      window.addEventListener('online', () => {
        if (!this.isSyncing) {
          this.syncAll({ priority: 'high' }).catch(console.error);
        }
      });
    }
  }

  async syncAll(options: TSyncOptions = {}): Promise<TSyncResult> {
    // Return existing promise if already syncing
    if (this.isSyncing && this.syncPromise) {
      return this.syncPromise;
    }

    const finalOptions = { ...this.defaultOptions, ...options };
    
    this.isSyncing = true;
    this.emitEvent('sync-start', { options: finalOptions });

    this.syncPromise = this.performSync(finalOptions);
    
    try {
      const result = await this.syncPromise;
      this.emitEvent('sync-complete', result);
      return result;
    } catch (error) {
      this.emitEvent('sync-error', { error });
      throw error;
    } finally {
      this.isSyncing = false;
      this.syncPromise = null;
    }
  }

  private async performSync(options: Required<TSyncOptions>): Promise<TSyncResult> {
    const client = getLocalClient();
    
    if (!client.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    const results: TSyncResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Sync each entity type
    for (const entity of options.entities) {
      try {
        this.emitEvent('entity-sync-start', { entity });
        
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

        this.emitEvent('entity-sync-complete', { 
          entity, 
          result: entityResult 
        });

      } catch (error) {
        console.error(`Failed to sync ${entity}:`, error);
        results.errors.push(error as Error);
        results.failed++;

        this.emitEvent('entity-sync-error', { 
          entity, 
          error 
        });
      }
    }

    return results;
  }

  async getSyncStats(): Promise<TSyncStats> {
    const stats: TSyncStats = {
      totalPending: 0,
      totalSynced: 0,
      totalFailed: 0,
      entitiesStatus: {}
    };

    try {
      // Get pending operations from sync queue
      const pendingOps = syncQueue.getPendingOperations();
      stats.totalPending = pendingOps.length;

      // Get unsynced records for each entity
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
          synced: 0, // Would need to calculate from total - pending
          failed: 0  // Would need to track failed syncs
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

  async forceSyncEntity(entity: string): Promise<TSyncResult> {
    return this.syncAll({ 
      entities: [entity],
      priority: 'high'
    });
  }

  async retryFailedOperations(): Promise<TSyncResult> {
    return this.syncAll({
      retryFailedOnly: true,
      priority: 'high'
    });
  }

  // Batch sync with controlled concurrency
  async batchSync(
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

        // Add small delay between batches to avoid overwhelming the server
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

  // Event system for UI updates
  addEventListener(callback: (event: { type: string; data: any }) => void): () => void {
    this.eventListeners.push(callback);
    
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(type: string, data: any): void {
    this.eventListeners.forEach(callback => {
      try {
        callback({ type, data });
      } catch (error) {
        console.error('Sync orchestrator event listener error:', error);
      }
    });
  }

  // Get current sync status
  getSyncStatus(): { 
    isSyncing: boolean;
    hasActiveSyncPromise: boolean;
  } {
    return {
      isSyncing: this.isSyncing,
      hasActiveSyncPromise: this.syncPromise !== null,
    };
  }

  // Priority sync for critical operations
  async prioritySync(entity: string, recordIds: number[]): Promise<TSyncResult> {
    // This would implement priority sync for specific records
    // For now, just sync the entire entity with high priority
    return this.forceSyncEntity(entity);
  }

  // Cleanup method
  cleanup(): void {
    this.eventListeners = [];
    if (this.syncPromise) {
      this.syncPromise = null;
    }
    this.isSyncing = false;
  }
}

// Singleton instance
let syncOrchestratorInstance: SyncOrchestrator | null = null;

export function getSyncOrchestrator(): SyncOrchestrator {
  if (!syncOrchestratorInstance) {
    syncOrchestratorInstance = new SyncOrchestrator();
  }
  return syncOrchestratorInstance;
}

export { SyncOrchestrator };
