import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// Types for connection status and sync management
export type ConnectionStatus = 'online' | 'offline' | 'syncing' | 'error';
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type TLocalClientConfig = {
  localDbPath?: string;
  syncUrl?: string;
  authToken?: string;
  syncInterval?: number;
};

export type TSyncEvent = {
  type: 'sync-start' | 'sync-success' | 'sync-error' | 'connection-change';
  timestamp: Date;
  details?: string;
  error?: Error;
};

class LocalDatabaseClient {
  private client: ReturnType<typeof createClient> | null = null;
  private db: ReturnType<typeof drizzle> | null = null;
  private connectionStatus: ConnectionStatus = 'offline';
  private syncStatus: SyncStatus = 'idle';
  private syncInterval: NodeJS.Timeout | null = null;
  private eventListeners: Array<(event: TSyncEvent) => void> = [];
  
  private config: Required<TLocalClientConfig> = {
    localDbPath: 'finance-local.db',
    syncUrl: '',
    authToken: '',
    syncInterval: 30000 // 30 seconds
  };

  constructor(config?: TLocalClientConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(): Promise<void> {
    try {
      // Create client with both local and remote capabilities
      this.client = createClient({
        url: `file:${this.config.localDbPath}`,
        syncUrl: this.config.syncUrl || process.env.TURSO_SYNC_URL,
        authToken: this.config.authToken || process.env.TURSO_AUTH_TOKEN,
      });

      // Initialize Drizzle with the client
      this.db = drizzle(this.client);

      // Test connection and set initial status
      await this.testConnection();
      
      // Start periodic sync if we have remote config
      if (this.config.syncUrl && this.config.authToken) {
        this.startPeriodicSync();
      }

      this.emitEvent({
        type: 'connection-change',
        timestamp: new Date(),
        details: `Database initialized with status: ${this.connectionStatus}`
      });

    } catch (error) {
      this.connectionStatus = 'error';
      this.emitEvent({
        type: 'sync-error',
        timestamp: new Date(),
        error: error as Error
      });
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');
    
    try {
      // Test basic local operation
      await this.client.execute('SELECT 1');
      
      // Test sync capability if configured
      if (this.config.syncUrl) {
        try {
          await this.client.sync();
          this.connectionStatus = 'online';
        } catch (syncError) {
          // Local works but sync doesn't - we're offline
          this.connectionStatus = 'offline';
        }
      } else {
        this.connectionStatus = 'offline';
      }
    } catch (error) {
      this.connectionStatus = 'error';
      throw error;
    }
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.syncWithRemote();
    }, this.config.syncInterval);
  }

  async syncWithRemote(): Promise<boolean> {
    if (!this.client || this.syncStatus === 'syncing') {
      return false;
    }

    this.syncStatus = 'syncing';
    this.emitEvent({
      type: 'sync-start',
      timestamp: new Date()
    });

    try {
      await this.client.sync();
      this.syncStatus = 'success';
      this.connectionStatus = 'online';
      
      this.emitEvent({
        type: 'sync-success',
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      this.syncStatus = 'error';
      this.connectionStatus = 'offline';
      
      this.emitEvent({
        type: 'sync-error',
        timestamp: new Date(),
        error: error as Error
      });
      
      return false;
    }
  }

  // Get the Drizzle database instance
  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Get raw client for advanced operations
  getClient() {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  // Status getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  isOnline(): boolean {
    return this.connectionStatus === 'online';
  }

  isOffline(): boolean {
    return this.connectionStatus === 'offline';
  }

  // Event system for UI updates
  addEventListener(callback: (event: TSyncEvent) => void): () => void {
    this.eventListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: TSyncEvent): void {
    this.eventListeners.forEach(callback => callback(event));
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.client) {
      this.client.close();
      this.client = null;
      this.db = null;
    }
    
    this.eventListeners = [];
  }

  // Manual sync trigger
  async forcSync(): Promise<boolean> {
    return await this.syncWithRemote();
  }

  // Database health check
  async healthCheck(): Promise<{
    local: boolean;
    remote: boolean;
    lastSync?: Date;
  }> {
    const health = {
      local: false,
      remote: false,
      lastSync: undefined as Date | undefined
    };

    try {
      if (this.client) {
        await this.client.execute('SELECT 1');
        health.local = true;

        if (this.config.syncUrl) {
          try {
            await this.client.sync();
            health.remote = true;
            health.lastSync = new Date();
          } catch {
            health.remote = false;
          }
        }
      }
    } catch {
      health.local = false;
    }

    return health;
  }
}

// Singleton instance
let localDbClient: LocalDatabaseClient | null = null;

export function createLocalClient(config?: TLocalClientConfig): LocalDatabaseClient {
  if (!localDbClient) {
    localDbClient = new LocalDatabaseClient(config);
  }
  return localDbClient;
}

export function getLocalClient(): LocalDatabaseClient {
  if (!localDbClient) {
    throw new Error('Local client not initialized. Call createLocalClient() first.');
  }
  return localDbClient;
}

// Convenience function to get initialized database
export async function getLocalDb() {
  const client = getLocalClient();
  return client.getDb();
}

export { LocalDatabaseClient };
