'use client';

const SYNC_QUEUE_KEY = 'offline_sync_queue';
const SYNC_TAG = 'content-sync';

export interface SyncAction {
  id: string;
  type: 'reading_history' | 'bookmark' | 'recommendation_click';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export function isBackgroundSyncSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

export async function registerBackgroundSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

export function getSyncQueue(): SyncAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage unavailable
  }
}

export function addToSyncQueue(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getSyncQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retryCount: 0,
  });
  saveSyncQueue(queue);

  if (isBackgroundSyncSupported()) {
    registerBackgroundSync();
  }
}

export function clearSyncQueue(): void {
  saveSyncQueue([]);
}

export function removeSyncedAction(id: string): void {
  const queue = getSyncQueue();
  const filtered = queue.filter(action => action.id !== id);
  saveSyncQueue(filtered);
}

export function incrementRetryCount(id: string): void {
  const queue = getSyncQueue();
  const action = queue.find(a => a.id === id);
  if (action) {
    action.retryCount += 1;
    saveSyncQueue(queue);
  }
}

export async function syncReadingHistory(payload: {
  postId: number;
  slug: string;
  title: string;
  categoryIds: number[];
  tagIds: number[];
}): Promise<void> {
  try {
    const response = await fetch('/api/sync/reading-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Sync failed');
  } catch {
    addToSyncQueue({
      type: 'reading_history',
      payload,
    });
    throw new Error('Queued for later sync');
  }
}

export async function syncBookmark(payload: { postId: number; action: 'add' | 'remove' }): Promise<void> {
  try {
    const response = await fetch('/api/sync/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Sync failed');
  } catch {
    addToSyncQueue({
      type: 'bookmark',
      payload,
    });
    throw new Error('Queued for later sync');
  }
}