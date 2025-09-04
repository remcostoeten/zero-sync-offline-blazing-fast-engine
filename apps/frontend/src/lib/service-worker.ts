'use client';

import { getSyncOrchestrator } from './database/sync-orchestrator';

export type ServiceWorkerStatus = 
  | 'unsupported'
  | 'registering' 
  | 'registered'
  | 'error'
  | 'updating';

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private status: ServiceWorkerStatus = 'unsupported';
  private eventListeners: Array<(status: ServiceWorkerStatus) => void> = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!('serviceWorker' in navigator)) {
      this.updateStatus('unsupported');
      return;
    }

    this.updateStatus('registering');
    
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered successfully');
      this.updateStatus('registered');

      // Set up event listeners
      this.setupEventListeners();
      
      // Register for background sync
      await this.registerBackgroundSync();

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      this.updateStatus('error');
    }
  }

  private setupEventListeners() {
    if (!this.registration) return;

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('🔄 Service Worker update found');
      this.updateStatus('updating');

      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is ready
            console.log('🆕 New Service Worker ready');
            this.notifyUpdate();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });

    // Handle controller changes (when SW becomes active)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🎛️ Service Worker controller changed');
      // Reload to get the new version
      window.location.reload();
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    console.log('📨 Message from Service Worker:', data.type);

    switch (data.type) {
      case 'BACKGROUND_SYNC_REQUEST':
        // Service worker is requesting a sync
        this.performBackgroundSync();
        break;
        
      case 'SYNC_COMPLETE':
        console.log('✅ Background sync completed:', data.result);
        break;
        
      case 'SYNC_ERROR':
        console.error('❌ Background sync failed:', data.error);
        break;
        
      default:
        console.log('Unknown SW message:', data);
    }
  }

  private async performBackgroundSync() {
    try {
      console.log('🔄 Performing background sync requested by SW...');
      const syncOrchestrator = getSyncOrchestrator();
      const result = await syncOrchestrator.syncAll({ priority: 'low' });
      
      // Send result back to service worker
      this.postMessage({
        type: 'SYNC_COMPLETE',
        result
      });
      
      console.log('✅ Background sync completed:', result);
    } catch (error) {
      console.error('❌ Background sync failed:', error);
      
      this.postMessage({
        type: 'SYNC_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async registerBackgroundSync(): Promise<boolean> {
    if (!this.registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('⚠️ Background Sync not supported');
      return false;
    }

    try {
      // Register background sync with service worker
      const channel = new MessageChannel();
      
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          const { success } = event.data;
          if (success) {
            console.log('✅ Background sync registered');
            resolve(true);
          } else {
            console.error('❌ Failed to register background sync');
            resolve(false);
          }
        };

        this.postMessage({
          type: 'REGISTER_BACKGROUND_SYNC'
        }, [channel.port2]);
      });

    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
      return false;
    }
  }

  async requestBackgroundSync(): Promise<void> {
    if (!this.registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('⚠️ Background Sync not supported');
      return;
    }

    try {
      await this.registration.sync.register('background-sync-finance');
      console.log('✅ Background sync task registered');
    } catch (error) {
      console.error('❌ Failed to register background sync task:', error);
    }
  }

  private postMessage(message: any, transfer?: Transferable[]) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message, transfer || []);
    } else if (this.registration?.active) {
      this.registration.active.postMessage(message, transfer || []);
    }
  }

  private updateStatus(status: ServiceWorkerStatus) {
    this.status = status;
    this.eventListeners.forEach(listener => listener(status));
  }

  private notifyUpdate() {
    // Show update notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of the app is ready. Refresh to update.',
        icon: '/icon-192x192.png',
        tag: 'app-update'
      });
    }
  }

  // Update the service worker
  async updateServiceWorker(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    this.postMessage({ type: 'SKIP_WAITING' });
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Get current status
  getStatus(): ServiceWorkerStatus {
    return this.status;
  }

  // Add status listener
  addStatusListener(listener: (status: ServiceWorkerStatus) => void): () => void {
    this.eventListeners.push(listener);
    
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  // Check if background sync is supported
  isBackgroundSyncSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'sync' in window.ServiceWorkerRegistration.prototype;
  }

  // Check if notifications are supported
  areNotificationsSupported(): boolean {
    return 'Notification' in window;
  }

  // Cleanup
  cleanup(): void {
    this.eventListeners = [];
  }
}

// Singleton instance
let swManagerInstance: ServiceWorkerManager | null = null;

export function getServiceWorkerManager(): ServiceWorkerManager {
  if (!swManagerInstance) {
    swManagerInstance = new ServiceWorkerManager();
  }
  return swManagerInstance;
}

// Hook for React components
export function useServiceWorker() {
  const manager = getServiceWorkerManager();
  return {
    status: manager.getStatus(),
    isSupported: 'serviceWorker' in navigator,
    isBackgroundSyncSupported: manager.isBackgroundSyncSupported(),
    areNotificationsSupported: manager.areNotificationsSupported(),
    requestBackgroundSync: () => manager.requestBackgroundSync(),
    requestNotificationPermission: () => manager.requestNotificationPermission(),
    updateServiceWorker: () => manager.updateServiceWorker(),
    skipWaiting: () => manager.skipWaiting()
  };
}

export { ServiceWorkerManager };
