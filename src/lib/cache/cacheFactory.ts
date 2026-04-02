import type { ICacheManager } from '@/lib/api/ICacheManager';
import { cacheManager } from '@/lib/cache';
import { RedisCacheAdapter, type CacheAdapterType, type RedisConfig } from '@/lib/cache/redisCacheAdapter';

const CACHE_ADAPTER_TYPE = (process.env.CACHE_ADAPTER || 'memory') as CacheAdapterType;

export function createCacheManager(adapterType?: CacheAdapterType, redisConfig?: RedisConfig): ICacheManager {
  const type = adapterType || CACHE_ADAPTER_TYPE;

  if (type === 'redis') {
    const adapter = new RedisCacheAdapter(redisConfig);
    adapter.connect().catch(err => {
      console.error('[Cache] Failed to connect Redis adapter, falling back to memory:', err);
    });
    return adapter;
  }

  return cacheManager;
}

export function getCacheAdapterType(): CacheAdapterType {
  return CACHE_ADAPTER_TYPE;
}

export function isRedisEnabled(): boolean {
  return CACHE_ADAPTER_TYPE === 'redis';
}

export { RedisCacheAdapter, type CacheAdapterType, type RedisConfig, type RedisMetrics } from '@/lib/cache/redisCacheAdapter';
