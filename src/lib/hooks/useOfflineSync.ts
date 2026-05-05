'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isBackgroundSyncSupported,
  getSyncQueue,
  addToSyncQueue,
  clearSyncQueue,
  type SyncAction,
} from '@/lib/utils/syncQueue';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  isBackgroundSyncSupported: boolean;
  pendingActions: SyncAction[];
  queueCount: number;
  forceSync: () => Promise<void>;
  clearQueue: () => void;
  addReadingHistoryAction: (data: {
    postId: number;
    slug: string;
    title: string;
    categoryIds: number[];
    tagIds: number[];
  }) => void;
  addBookmarkAction: (data: { postId: number; action: 'add' | 'remove' }) => void;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<SyncAction[]>([]);

  const supported = typeof window !== 'undefined' ? isBackgroundSyncSupported() : false;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setPendingActions(getSyncQueue());

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingActions(getSyncQueue());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const forceSync = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'SYNC_NOW' });
    }
  }, []);

  const clearQueue = useCallback(() => {
    clearSyncQueue();
    setPendingActions([]);
  }, []);

  const addReadingHistoryAction = useCallback((data: {
    postId: number;
    slug: string;
    title: string;
    categoryIds: number[];
    tagIds: number[];
  }) => {
    if (isOnline) {
      fetch('/api/sync/reading-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        addToSyncQueue({ type: 'reading_history', payload: data });
      });
    } else {
      addToSyncQueue({ type: 'reading_history', payload: data });
    }
  }, [isOnline]);

  const addBookmarkAction = useCallback((data: { postId: number; action: 'add' | 'remove' }) => {
    if (isOnline) {
      fetch('/api/sync/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        addToSyncQueue({ type: 'bookmark', payload: data });
      });
    } else {
      addToSyncQueue({ type: 'bookmark', payload: data });
    }
  }, [isOnline]);

  return {
    isOnline,
    isBackgroundSyncSupported: supported,
    pendingActions,
    queueCount: pendingActions.length,
    forceSync,
    clearQueue,
    addReadingHistoryAction,
    addBookmarkAction,
  };
}