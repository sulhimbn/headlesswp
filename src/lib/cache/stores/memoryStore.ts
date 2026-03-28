import type { ICacheStore, CacheStoreOptions } from '../types';

export class MemoryCacheStore implements ICacheStore {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private options: Required<CacheStoreOptions>;

  constructor(options: CacheStoreOptions = {}) {
    this.options = {
      redisUrl: options.redisUrl ?? '',
      keyPrefix: options.keyPrefix ?? 'cache:',
      defaultTtl: options.defaultTtl ?? 300000,
    };
  }

  private getKey(key: string): string {
    return `${this.options.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      await this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const fullKey = this.getKey(key);
    this.cache.set(fullKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    return this.cache.delete(fullKey);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys.map(key => key.replace(this.options.keyPrefix, ''));
    }

    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys
      .filter(key => regex.test(key))
      .map(key => key.replace(this.options.keyPrefix, ''));
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> {
    this.cache.clear();
  }
}
