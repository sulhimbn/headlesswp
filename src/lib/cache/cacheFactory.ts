import type { ICacheManager } from '@/lib/api/ICacheManager';
import { cacheManager } from '../cache';
import { getRedisCacheAdapter, RedisCacheAdapter } from './redisAdapter';
import { REDIS_CONFIG } from './redisConfig';

export type CacheMode = 'memory' | 'redis';

export interface CacheManagerOptions {
  mode?: CacheMode;
  fallbackToMemory?: boolean;
}

let currentCacheManager: ICacheManager;
let currentMode: CacheMode = 'memory';

export function getCacheManager(options: CacheManagerOptions = {}): ICacheManager {
  const mode = options.mode ?? determineCacheMode();
  
  if (currentCacheManager && currentMode === mode) {
    return currentCacheManager;
  }

  const fallbackToMemory = options.fallbackToMemory ?? true;

  if (mode === 'redis') {
    const redisAdapter = getRedisCacheAdapter();
    
    if (redisAdapter.isUsingFallback() && fallbackToMemory) {
      console.warn('[CacheFactory] Redis unavailable, falling back to in-memory cache');
      currentMode = 'memory';
      currentCacheManager = cacheManager;
      return currentCacheManager;
    }

    currentMode = 'redis';
    currentCacheManager = redisAdapter;
    return currentCacheManager;
  }

  currentMode = 'memory';
  currentCacheManager = cacheManager;
  return currentCacheManager;
}

function determineCacheMode(): CacheMode {
  if (process.env.REDIS_ENABLED === 'true') {
    return 'redis';
  }
  return 'memory';
}

export function isRedisEnabled(): boolean {
  return REDIS_CONFIG.enabled;
}

export function getCurrentCacheMode(): CacheMode {
  return currentMode;
}

export function isUsingRedis(): boolean {
  return currentMode === 'redis';
}

export { RedisCacheAdapter };
