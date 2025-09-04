'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocalDatabase } from '@/lib/hooks/use-local-database';
import { initializeLocalDatabase, seedDemoData } from '@/lib/database/init-local-db';
import { initializeSyncQueue, processPendingSyncOperations } from '@/lib/database/local-crud-factory';

type DatabaseContextType = {
  isInitialized: boolean;
  isInitializing: boolean;
  connectionStatus: 'online' | 'offline' | 'syncing' | 'error';
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  isOnline: boolean;
  isOffline: boolean;
  lastSyncAt?: Date;
  error?: Error;
  forceSync: () => Promise<boolean>;
  healthCheck: () => Promise<{ local: boolean; remote: boolean; lastSync?: Date }>;
};

const DatabaseContext = createContext<DatabaseContextType | null>(null);

type DatabaseProviderProps = {
  children: ReactNode;
  syncUrl?: string;
  authToken?: string;
  autoSync?: boolean;
  syncInterval?: number;
};

export function DatabaseProvider({ 
  children, 
  syncUrl,
  authToken,
  autoSync = true,
  syncInterval = 30000,
}: DatabaseProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);

  const {
    isInitialized,
    connectionStatus,
    syncStatus,
    isOnline,
    isOffline,
    lastSyncAt,
    error: hookError,
    initialize,
    forceSync,
    healthCheck,
  } = useLocalDatabase({
    syncUrl: syncUrl || process.env.NEXT_PUBLIC_TURSO_SYNC_URL,
    authToken: authToken || process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
    syncInterval: autoSync ? syncInterval : undefined,
  });

  // Initialize database on mount
  useEffect(() => {
    async function initDatabase() {
      try {
        setIsInitializing(true);
        
        console.log('🚀 Initializing local-first database...');
        
        // Initialize the local database client
        await initialize();
        
        // Initialize sync queue from localStorage
        initializeSyncQueue();
        
        // Create database tables
        await initializeLocalDatabase();
        
        // Seed demo data if needed
        await seedDemoData();
        
        // Process any pending sync operations
        await processPendingSyncOperations();
        
        console.log('✅ Local-first database initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        setInitError(error as Error);
      } finally {
        setIsInitializing(false);
      }
    }

    initDatabase();
  }, [initialize]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isInitialized && isOnline && autoSync) {
      processPendingSyncOperations().catch(console.error);
    }
  }, [isInitialized, isOnline, autoSync]);

  // Handle page visibility change for sync
  useEffect(() => {
    if (!isInitialized || !autoSync) return;

    function handleVisibilityChange() {
      if (!document.hidden && isOnline) {
        processPendingSyncOperations().catch(console.error);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInitialized, isOnline, autoSync]);

  const contextValue: DatabaseContextType = {
    isInitialized: isInitialized && !isInitializing,
    isInitializing,
    connectionStatus,
    syncStatus,
    isOnline,
    isOffline,
    lastSyncAt,
    error: initError || hookError,
    forceSync,
    healthCheck,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}

// Status indicator component
export function DatabaseStatusIndicator() {
  const { 
    isInitialized, 
    isInitializing, 
    connectionStatus, 
    syncStatus,
    lastSyncAt,
    error,
    forceSync 
  } = useDatabaseContext();

  if (isInitializing) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        Initializing database...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        Database error: {error.message}
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        Database not initialized
      </div>
    );
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-orange-600';
      case 'syncing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusDot = () => {
    switch (connectionStatus) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-orange-500';
      case 'syncing': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'syncing': return 'Syncing...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusDot()}`}></div>
      <span>{getStatusText()}</span>
      
      {lastSyncAt && connectionStatus === 'online' && (
        <span className="text-gray-500">
          (last sync: {lastSyncAt.toLocaleTimeString()})
        </span>
      )}
      
      {connectionStatus === 'offline' && (
        <button
          onClick={() => forceSync()}
          className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          Retry Sync
        </button>
      )}
    </div>
  );
}

// Sync status component for debugging
export function SyncStatusDebug() {
  const { 
    isInitialized,
    connectionStatus,
    syncStatus,
    isOnline,
    isOffline,
    lastSyncAt,
    healthCheck 
  } = useDatabaseContext();

  const [health, setHealth] = useState<{ local: boolean; remote: boolean; lastSync?: Date } | null>(null);

  useEffect(() => {
    if (isInitialized) {
      healthCheck().then(setHealth).catch(console.error);
    }
  }, [isInitialized, healthCheck]);

  if (!isInitialized) {
    return <div className="text-sm text-gray-500">Database not initialized</div>;
  }

  return (
    <div className="space-y-2 text-xs text-gray-600 border p-3 rounded">
      <div><strong>Database Status:</strong></div>
      <div>• Initialized: {isInitialized ? '✅' : '❌'}</div>
      <div>• Connection: {connectionStatus}</div>
      <div>• Sync Status: {syncStatus}</div>
      <div>• Online: {isOnline ? '✅' : '❌'}</div>
      <div>• Offline: {isOffline ? '✅' : '❌'}</div>
      {lastSyncAt && <div>• Last Sync: {lastSyncAt.toLocaleString()}</div>}
      
      {health && (
        <div>
          <div><strong>Health Check:</strong></div>
          <div>• Local DB: {health.local ? '✅' : '❌'}</div>
          <div>• Remote Sync: {health.remote ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
}
