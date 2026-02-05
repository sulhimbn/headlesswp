import type { ICacheManager } from '@/lib/api/ICacheManager';
import { logger } from '@/lib/utils/logger';

export interface BatchOperationOptions<T> {
  ids: number[];
  cacheKeyFn: (id: number) => string;
  cacheManager: ICacheManager;
  cacheTtl: number;
  fetchFn: (idsToFetch: number[], signal?: AbortSignal) => Promise<T[]>;
  extractIdFn: (item: T) => number;
  skipZero?: boolean;
  signal?: AbortSignal;
  onSuccess?: (item: T, result: Map<number, T | null>, cacheManager: ICacheManager, cacheKeyFn: (id: number) => string, cacheTtl: number) => void;
  onError?: (error: unknown, idsToFetch: number[]) => void;
}

export function createBatchOperation<T>(options: BatchOperationOptions<T>): Promise<Map<number, T | null>> {
  return executeBatchOperation(options);
}

async function executeBatchOperation<T>(options: BatchOperationOptions<T>): Promise<Map<number, T | null>> {
  const result = new Map<number, T | null>();
  const idsToFetch: number[] = [];
  const idsToFetchSet = new Set<number>();

  for (const id of options.ids) {
    if (id === 0) {
      if (!options.skipZero) {
        result.set(id, null);
      }
      continue;
    }

    const cacheKey = options.cacheKeyFn(id);
    const cached = options.cacheManager.get<T>(cacheKey);
    if (cached) {
      result.set(id, cached);
    } else if (!idsToFetchSet.has(id)) {
      idsToFetch.push(id);
      idsToFetchSet.add(id);
    }
  }

  if (idsToFetch.length === 0) {
    return result;
  }

  try {
    const items = await options.fetchFn(idsToFetch, options.signal);

    for (const item of items) {
      const itemId = options.extractIdFn(item);
      if (options.onSuccess) {
        options.onSuccess(item, result, options.cacheManager, options.cacheKeyFn, options.cacheTtl);
      } else {
        result.set(itemId, item);
        const cacheKey = options.cacheKeyFn(itemId);
        options.cacheManager.set(cacheKey, item, options.cacheTtl);
      }
    }
  } catch (error) {
    if (options.onError) {
      options.onError(error, idsToFetch);
    } else {
      throw error;
    }
  }

  for (const id of idsToFetch) {
    if (!result.has(id)) {
      result.set(id, null);
    }
  }

  return result;
}

export function createBatchOperationFactory<T>(defaultOptions: Partial<BatchOperationOptions<T>>) {
  return (options: Omit<BatchOperationOptions<T>, keyof typeof defaultOptions>) => {
    return createBatchOperation({ ...defaultOptions, ...options });
  };
}
