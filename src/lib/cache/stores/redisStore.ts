/* eslint-disable @typescript-eslint/no-explicit-any */
import Redis from 'ioredis';
import type { CacheEntry } from '../types';
import type { ICacheStore, CacheStoreOptions } from './ICacheStore';

export class RedisCacheStore implements ICacheStore {
  private redis: Redis | null = null;
  private prefix: string;
  private ready = false;
  private fallbackMode = false;

  constructor(options: CacheStoreOptions = {}) {
    this.prefix = options.prefix || 'cache:';
    this.initRedis(options.redisUrl);
  }

  private initRedis(redisUrl?: string): void {
    if (!redisUrl) {
      this.fallbackMode = true;
      this.ready = false;
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.fallbackMode = true;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.ready = true;
        this.fallbackMode = false;
      });

      this.redis.on('error', () => {
        this.fallbackMode = true;
        this.ready = false;
      });
    } catch {
      this.fallbackMode = true;
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready && !this.fallbackMode;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): CacheEntry<T> | null {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return null;
    }

    try {
      const data = (this.redis as any).get(this.getKey(key)) as string | null;
      
      if (!data) return null;
      
      const parsed = JSON.parse(data) as CacheEntry<T>;
      
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        this.delete(key);
        return null;
      }
      
      return parsed;
    } catch {
      return null;
    }
  }

  set<T>(key: string, entry: CacheEntry<T>): void {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return;
    }

    try {
      (this.redis as any).set(
        this.getKey(key),
        JSON.stringify(entry),
        'EX',
        Math.ceil(entry.ttl / 1000)
      );
    } catch {
      // Silently fail - cache is optional
    }
  }

  delete(key: string): boolean {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return false;
    }

    try {
      const result = (this.redis as any).del(this.getKey(key)) as number;
      return result > 0;
    } catch {
      return false;
    }
  }

  clearAll(): void {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return;
    }

    try {
      (this.redis as any).keys(`${this.prefix}*`).then((keys: string[]) => {
        if (keys && keys.length > 0) {
          this.redis?.del(...keys);
        }
      });
    } catch {
      // Silently fail
    }
  }

  clearPattern(pattern: string): number {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return 0;
    }

    try {
      const regex = new RegExp(pattern);
      let count = 0;
      
      (this.redis as any).keys(`${this.prefix}*`).then((keys: string[]) => {
        if (!keys || keys.length === 0) return;

        const matchedKeys: string[] = [];
        for (const key of keys) {
          const shortKey = key.replace(this.prefix, '');
          if (regex.test(shortKey)) {
            matchedKeys.push(key);
          }
        }

        if (matchedKeys.length > 0) {
          this.redis?.del(...matchedKeys);
        }
        count = matchedKeys.length;
      });
      
      return count;
    } catch {
      return 0;
    }
  }

  getKeysByPattern(pattern: string): string[] {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return [];
    }

    try {
      const regex = new RegExp(pattern);
      let result: string[] = [];
      
      (this.redis as any).keys(`${this.prefix}*`).then((keys: string[]) => {
        if (!keys || keys.length === 0) return;

        result = keys
          .map((key: string) => key.replace(this.prefix, ''))
          .filter((key: string) => regex.test(key));
      });
      
      return result;
    } catch {
      return [];
    }
  }

  getAll(): Map<string, CacheEntry<unknown>> {
    return new Map();
  }

  size(): number {
    if (this.fallbackMode || !this.redis || !this.ready) {
      return 0;
    }

    try {
      let count = 0;
      (this.redis as any).keys(`${this.prefix}*`).then((keys: string[]) => {
        count = keys ? keys.length : 0;
      });
      return count;
    } catch {
      return 0;
    }
  }

  disconnect(): void {
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
      this.ready = false;
    }
  }
}
