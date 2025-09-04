'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  createLocalClient, 
  getLocalClient, 
  type ConnectionStatus, 
  type SyncStatus, 
  type TSyncEvent,
  type TLocalClientConfig 
} from '@/lib/database/local-client';

type DatabaseState = {
  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  syncStatus: SyncStatus;
  isOnline: boolean;
  isOffline: boolean;
  lastSyncAt?: Date;
  error?: Error;
};

type DatabaseActions = {
  initialize: (config?: TLocalClientConfig) => Promise<void>;
  forceSync: () => Promise<boolean>;
  healthCheck: () => Promise<{ local: boolean; remote: boolean; lastSync?: Date }>;
  getDb: () => ReturnType<typeof getLocalClient>['getDb'] | null;
};

export function useLocalDatabase(config?: TLocalClientConfig): DatabaseState & DatabaseActions {
  const [state, setState] = useState<DatabaseState>({
    isInitialized: false,
    connectionStatus: 'offline',
    syncStatus: 'idle',
    isOnline: false,
    isOffline: true,
    lastSyncAt: undefined,
    error: undefined,
  });

  const clientRef = useRef<ReturnType<typeof createLocalClient> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize database
  const initialize = useCallback(async (initConfig?: TLocalClientConfig) => {
    try {
      const finalConfig = { ...config, ...initConfig };
      clientRef.current = createLocalClient(finalConfig);
      
      // Subscribe to events before initializing
      unsubscribeRef.current = clientRef.current.addEventListener((event: TSyncEvent) => {
        setState(prev => {
          const newState = { ...prev };
          
          switch (event.type) {
            case 'connection-change':
              const client = clientRef.current;
              if (client) {
                newState.connectionStatus = client.getConnectionStatus();
                newState.isOnline = client.isOnline();
                newState.isOffline = client.isOffline();
              }
              break;
              
            case 'sync-start':
              newState.syncStatus = 'syncing';
              break;
              
            case 'sync-success':
              newState.syncStatus = 'success';
              newState.lastSyncAt = event.timestamp;
              newState.connectionStatus = 'online';
              newState.isOnline = true;
              newState.isOffline = false;
              newState.error = undefined;
              break;
              
            case 'sync-error':
              newState.syncStatus = 'error';
              newState.error = event.error;
              newState.connectionStatus = 'offline';
              newState.isOnline = false;
              newState.isOffline = true;
              break;
          }
          
          return newState;
        });
      });

      await clientRef.current.initialize();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        connectionStatus: clientRef.current!.getConnectionStatus(),
        isOnline: clientRef.current!.isOnline(),
        isOffline: clientRef.current!.isOffline(),
        error: undefined,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        connectionStatus: 'error',
        isOnline: false,
        isOffline: true,
      }));
      throw error;
    }
  }, [config]);

  // Force sync
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (!clientRef.current) {
      throw new Error('Database not initialized');
    }
    return await clientRef.current.forcSync();
  }, []);

  // Health check
  const healthCheck = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error('Database not initialized');
    }
    return await clientRef.current.healthCheck();
  }, []);

  // Get database instance
  const getDb = useCallback(() => {
    if (!clientRef.current || !state.isInitialized) {
      return null;
    }
    try {
      return clientRef.current.getDb();
    } catch {
      return null;
    }
  }, [state.isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (clientRef.current) {
        clientRef.current.close();
      }
    };
  }, []);

  // Auto-initialize if config provided
  useEffect(() => {
    if (config && !state.isInitialized) {
      initialize(config).catch(console.error);
    }
  }, [config, state.isInitialized, initialize]);

  return {
    // State
    isInitialized: state.isInitialized,
    connectionStatus: state.connectionStatus,
    syncStatus: state.syncStatus,
    isOnline: state.isOnline,
    isOffline: state.isOffline,
    lastSyncAt: state.lastSyncAt,
    error: state.error,
    
    // Actions
    initialize,
    forceSync,
    healthCheck,
    getDb,
  };
}

// Hook for sync status only (lighter weight)
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<{
    status: SyncStatus;
    lastSync?: Date;
    error?: Error;
  }>({
    status: 'idle',
    lastSync: undefined,
    error: undefined,
  });

  useEffect(() => {
    try {
      const client = getLocalClient();
      
      const unsubscribe = client.addEventListener((event: TSyncEvent) => {
        switch (event.type) {
          case 'sync-start':
            setSyncStatus(prev => ({ ...prev, status: 'syncing', error: undefined }));
            break;
          case 'sync-success':
            setSyncStatus({ status: 'success', lastSync: event.timestamp, error: undefined });
            break;
          case 'sync-error':
            setSyncStatus(prev => ({ ...prev, status: 'error', error: event.error }));
            break;
        }
      });

      return unsubscribe;
    } catch {
      // Client not initialized yet
      return () => {};
    }
  }, []);

  return syncStatus;
}

// Hook for connection status only
export function useConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');

  useEffect(() => {
    try {
      const client = getLocalClient();
      setConnectionStatus(client.getConnectionStatus());
      
      const unsubscribe = client.addEventListener((event: TSyncEvent) => {
        if (event.type === 'connection-change' || 
            event.type === 'sync-success' || 
            event.type === 'sync-error') {
          setConnectionStatus(client.getConnectionStatus());
        }
      });

      return unsubscribe;
    } catch {
      // Client not initialized yet
      return () => {};
    }
  }, []);

  return {
    status: connectionStatus,
    isOnline: connectionStatus === 'online',
    isOffline: connectionStatus === 'offline',
    isError: connectionStatus === 'error',
    isSyncing: connectionStatus === 'syncing',
  };
}
