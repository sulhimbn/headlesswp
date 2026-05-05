'use client';

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import {
  isBackgroundSyncSupported,
  registerBackgroundSync,
  getSyncQueue,
  removeSyncedAction,
  incrementRetryCount,
  type SyncAction,
} from '@/lib/utils/syncQueue';

async function processSyncQueue() {
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const successfulIds: string[] = [];

  for (const action of queue) {
    try {
      const endpoint = getEndpointForAction(action);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      });

      if (response.ok) {
        successfulIds.push(action.id);
      } else {
        incrementRetryCount(action.id);
      }
    } catch {
      incrementRetryCount(action.id);
    }
  }

  successfulIds.forEach(id => removeSyncedAction(id));
}

function getEndpointForAction(action: SyncAction): string {
  switch (action.type) {
    case 'reading_history':
      return '/api/sync/reading-history';
    case 'bookmark':
      return '/api/sync/bookmark';
    case 'recommendation_click':
      return '/api/sync/recommendation-click';
    default:
      return '/api/sync/unknown';
  }
}

export default function ServiceWorkerRegistration() {
  const syncStatusRef = useRef<{ isOnline: boolean; lastSync: number }>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    lastSync: 0,
  });

  const handleOnline = useCallback(async () => {
    logger.warn('Network online - processing sync queue', undefined, {
      module: 'ServiceWorkerRegistration',
    });

    syncStatusRef.current.isOnline = true;
    await processSyncQueue();

    if (isBackgroundSyncSupported()) {
      await registerBackgroundSync();
    }

    syncStatusRef.current.lastSync = Date.now();
  }, []);

  const handleOffline = useCallback(() => {
    logger.warn('Network offline - actions will be queued', undefined, {
      module: 'ServiceWorkerRegistration',
    });
    syncStatusRef.current.isOnline = false;
  }, []);

  const handleSyncEvent = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'SYNC_COMPLETED') {
      logger.warn('Background sync completed', undefined, {
        module: 'ServiceWorkerRegistration',
        successful: event.data.successful,
        failed: event.data.failed,
      });

      if (event.data.successful > 0) {
        const remaining = getSyncQueue();
        logger.warn('Remaining items in queue', undefined, {
          module: 'ServiceWorkerRegistration',
          count: remaining.length,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            logger.warn('SW registered:', undefined, {
              scope: registration.scope,
              module: 'ServiceWorkerRegistration',
            });

            if (isBackgroundSyncSupported()) {
              logger.warn('Background Sync API supported', undefined, {
                module: 'ServiceWorkerRegistration',
              });
              registerBackgroundSync();
            } else {
              logger.warn('Background Sync not supported, using fallback', undefined, {
                module: 'ServiceWorkerRegistration',
              });
            }
          })
          .catch(error => {
            logger.error('SW registration failed', error, {
              module: 'ServiceWorkerRegistration',
            });
          });

        navigator.serviceWorker.addEventListener('message', handleSyncEvent);
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, handleSyncEvent]);

  return null;
}

export function getNetworkStatus(): { isOnline: boolean; lastSync: number } {
  if (typeof window === 'undefined') {
    return { isOnline: true, lastSync: 0 };
  }
  return {
    isOnline: navigator.onLine,
    lastSync: 0,
  };
}

export { getSyncQueue, isBackgroundSyncSupported };