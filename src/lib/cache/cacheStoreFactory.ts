import type { ICacheStore, RedisConfig, CacheStoreOptions } from './types';
import { RedisCacheStore } from './stores/redisStore';
import { InMemoryCacheStore } from './stores/memoryStore';

export type CacheStoreType = 'redis' | 'memory';

export interface CacheStoreFactoryConfig {
  storeType?: CacheStoreType;
  redis?: RedisConfig;
  options?: CacheStoreOptions;
}

let cachedStore: ICacheStore | null = null;

export function createCacheStore(config: CacheStoreFactoryConfig = {}): ICacheStore {
  if (cachedStore) {
    return cachedStore;
  }

  const storeType = determineStoreType(config.storeType);
  
  if (storeType === 'redis') {
    try {
      const redisStore = new RedisCacheStore(config.redis, config.options);
      redisStore.setOnConnectionError((error) => {
        console.error('Redis connection error, falling back to memory:', error.message);
        cachedStore = new InMemoryCacheStore(config.options);
      });
      cachedStore = redisStore;
      return redisStore;
    } catch (error) {
      console.warn('Failed to create Redis store, falling back to in-memory:', error instanceof Error ? error.message : 'Unknown error');
      cachedStore = new InMemoryCacheStore(config.options);
      return cachedStore;
    }
  }

  cachedStore = new InMemoryCacheStore(config.options);
  return cachedStore;
}

function determineStoreType(configured?: CacheStoreType): CacheStoreType {
  if (configured) {
    return configured;
  }

  if (process.env.REDIS_URL) {
    return 'redis';
  }

  return 'memory';
}

export async function initializeCacheStore(config: CacheStoreFactoryConfig = {}): Promise<ICacheStore> {
  const store = createCacheStore(config);
  
  if (store instanceof RedisCacheStore) {
    try {
      const health = await store.healthCheck();
      if (typeof health === 'object' && !health.healthy) {
        console.warn('Redis health check failed, falling back to in-memory store:', health.error);
        cachedStore = new InMemoryCacheStore(config.options);
        return cachedStore;
      }
    } catch {
      console.warn('Redis initialization failed, falling back to in-memory store');
      cachedStore = new InMemoryCacheStore(config.options);
    }
  }
  
  return store;
}

export function getCacheStore(): ICacheStore | null {
  return cachedStore;
}

export function clearCacheStore(): void {
  cachedStore = null;
}

export { RedisCacheStore } from './stores/redisStore';
export { InMemoryCacheStore } from './stores/memoryStore';
export type { ICacheStore } from './types';