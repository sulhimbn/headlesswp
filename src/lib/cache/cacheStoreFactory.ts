import type { ICacheStore, CacheStoreOptions, CacheStoreType } from './types';
import { MemoryCacheStore } from './stores/memoryStore';
import { RedisCacheStore } from './stores/redisStore';

export interface CacheStoreFactoryOptions {
  redisUrl?: string;
  keyPrefix?: string;
  defaultTtl?: number;
  fallbackToMemory?: boolean;
}

export async function createCacheStore(options: CacheStoreFactoryOptions = {}): Promise<ICacheStore> {
  const storeOptions: CacheStoreOptions = {
    redisUrl: options.redisUrl ?? process.env.REDIS_URL,
    keyPrefix: options.keyPrefix ?? 'headlesswp:cache:',
    defaultTtl: options.defaultTtl ?? 300000,
  };

  const useRedis = !!storeOptions.redisUrl;

  if (useRedis) {
    try {
      const redisStore = new RedisCacheStore(storeOptions);
      const isHealthy = await redisStore.healthCheck();

      if (isHealthy) {
        return redisStore;
      }

      console.warn('Redis health check failed, falling back to memory store');
    } catch (error) {
      console.warn('Failed to connect to Redis, falling back to memory store:', error);
    }
  }

  if (options.fallbackToMemory !== false) {
    return new MemoryCacheStore(storeOptions);
  }

  throw new Error('Unable to create cache store');
}

export function detectCacheStoreType(): CacheStoreType {
  if (process.env.REDIS_URL) {
    return 'redis';
  }
  return 'memory';
}

export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}
