'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDatabaseContext } from '@/lib/providers/database-provider';
import { 
  getCategoriesSyncQueue,
  getUnsyncedCategoriesLocal,
  syncAllCategoriesLocal 
} from '@/features/categories/local-actions';
import { 
  getTransactionsSyncQueue,
  getUnsyncedTransactionsLocal,
  syncAllTransactionsLocal 
} from '@/features/transactions/local-actions';
import { 
  getBudgetsSyncQueue,
  getUnsyncedBudgetsLocal,
  syncAllBudgetsLocal 
} from '@/features/budgets/local-actions';
import { getDatabaseInfo } from '@/lib/database/init-local-db';
import { RefreshCw, Database, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

type SyncStats = {
  categories: { total: number; unsynced: number };
  transactions: { total: number; unsynced: number };
  budgets: { total: number; unsynced: number };
};

type DatabaseInfo = {
  tables: string[];
  size: number;
  recordCounts: Record<string, number>;
};

export function SyncDashboard() {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    categories: { total: 0, unsynced: 0 },
    transactions: { total: 0, unsynced: 0 },
    budgets: { total: 0, unsynced: 0 },
  });

  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const {
    isInitialized,
    connectionStatus,
    syncStatus,
    isOnline,
    isOffline,
    lastSyncAt,
    error,
    forceSync,
    healthCheck
  } = useDatabaseContext();

  // Load sync stats
  const loadSyncStats = async () => {
    if (!isInitialized) return;
    
    setIsLoadingStats(true);
    try {
      const [
        unsyncedCategories,
        unsyncedTransactions,
        unsyncedBudgets,
        databaseInfo
      ] = await Promise.all([
        getUnsyncedCategoriesLocal(),
        getUnsyncedTransactionsLocal(),
        getUnsyncedBudgetsLocal(),
        getDatabaseInfo()
      ]);

      setSyncStats({
        categories: { 
          total: databaseInfo.recordCounts.categories || 0, 
          unsynced: unsyncedCategories.length 
        },
        transactions: { 
          total: databaseInfo.recordCounts.transactions || 0, 
          unsynced: unsyncedTransactions.length 
        },
        budgets: { 
          total: databaseInfo.recordCounts.budgets || 0, 
          unsynced: unsyncedBudgets.length 
        },
      });

      setDbInfo(databaseInfo);
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Sync all entities
  const syncAllData = async () => {
    if (!isOnline) {
      setLastSyncResult('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const [categoriesResult, transactionsResult, budgetsResult] = await Promise.all([
        syncAllCategoriesLocal(),
        syncAllTransactionsLocal(),
        syncAllBudgetsLocal()
      ]);

      const totalSuccess = categoriesResult.success + transactionsResult.success + budgetsResult.success;
      const totalFailed = categoriesResult.failed + transactionsResult.failed + budgetsResult.failed;

      if (totalFailed === 0) {
        setLastSyncResult(`✅ Successfully synced ${totalSuccess} records`);
      } else {
        setLastSyncResult(`⚠️ Synced ${totalSuccess} records, ${totalFailed} failed`);
      }

      // Refresh stats
      await loadSyncStats();
    } catch (error) {
      console.error('Sync failed:', error);
      setLastSyncResult(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load stats on mount and when connection changes
  useEffect(() => {
    if (isInitialized) {
      loadSyncStats();
    }
  }, [isInitialized, connectionStatus]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(loadSyncStats, 30000);
    return () => clearInterval(interval);
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <div className="w-4 h-4 bg-muted rounded-full animate-pulse"></div>
          Database not initialized...
        </div>
      </Card>
    );
  }

  const totalUnsynced = syncStats.categories.unsynced + syncStats.transactions.unsynced + syncStats.budgets.unsynced;
  const totalRecords = syncStats.categories.total + syncStats.transactions.total + syncStats.budgets.total;
  const syncedPercentage = totalRecords > 0 ? Math.round(((totalRecords - totalUnsynced) / totalRecords) * 100) : 100;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
            ) : (
              <WifiOff className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
            )}
            <div>
              <h3 className="font-semibold text-lg">Connection Status</h3>
              <p className={`text-sm ${isOnline ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                {connectionStatus === 'online' && 'Online - Auto-sync enabled'}
                {connectionStatus === 'offline' && 'Offline - Changes stored locally'}
                {connectionStatus === 'syncing' && 'Syncing with remote...'}
                {connectionStatus === 'error' && 'Connection error - Check your network'}
              </p>
            </div>
          </div>
          
          {lastSyncAt && (
            <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
              Last sync: {lastSyncAt.toLocaleString()}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-muted border border-neutral-300 dark:border-neutral-600 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-neutral-600 dark:text-neutral-400 mt-0.5" />
            <div className="text-sm text-foreground">{error.message}</div>
          </div>
        )}
      </Card>

      {/* Sync Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h3 className="font-semibold">Sync Progress</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {totalRecords - totalUnsynced}/{totalRecords} synced
            </span>
            <Button
              onClick={syncAllData}
              disabled={isSyncing || isOffline}
              size="sm"
              variant="default"
              className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className={totalUnsynced > 0 ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-600 dark:text-neutral-400'}>
              {syncedPercentage}%
            </span>
          </div>
          <Progress value={syncedPercentage} className="h-2" />
        </div>

        {lastSyncResult && (
          <div className="mt-4 p-3 bg-muted border border-neutral-300 dark:border-neutral-600 rounded-md text-sm">
            {lastSyncResult}
          </div>
        )}
      </Card>

      {/* Entity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(syncStats).map(([entity, stats]) => {
          const syncedCount = stats.total - stats.unsynced;
          const entityProgress = stats.total > 0 ? Math.round((syncedCount / stats.total) * 100) : 100;
          
          return (
            <Card key={entity} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{entity}</h4>
                {stats.unsynced > 0 ? (
                  <AlertCircle className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Records</span>
                  <span>{stats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unsynced</span>
                  <span className={stats.unsynced > 0 ? 'text-neutral-700 dark:text-neutral-300 font-medium' : 'text-neutral-600 dark:text-neutral-400'}>
                    {stats.unsynced}
                  </span>
                </div>
                <Progress value={entityProgress} className="h-1" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Database Info */}
      {dbInfo && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Information
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Tables</div>
              <div className="font-medium text-foreground">{dbInfo.tables.length}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Size</div>
              <div className="font-medium text-foreground">{formatFileSize(dbInfo.size)}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Records</div>
              <div className="font-medium text-foreground">{totalRecords}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Pending Sync</div>
              <div className={`font-medium ${totalUnsynced > 0 ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                {totalUnsynced}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
