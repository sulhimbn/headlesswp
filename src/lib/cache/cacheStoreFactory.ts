import { RedisCacheStore } from './stores/redisStore';
import { MemoryCacheStore } from './stores/memoryStore';
import type { ICacheStore } from './stores/ICacheStore';

export function createCacheStore(): ICacheStore {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return new RedisCacheStore({ redisUrl });
  }

  return new MemoryCacheStore();
}

export { RedisCacheStore, MemoryCacheStore };
export type { ICacheStore } from './stores/ICacheStore';
