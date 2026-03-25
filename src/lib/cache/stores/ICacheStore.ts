import type { CacheEntry } from '../types';

export interface ICacheStore {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, entry: CacheEntry<T>): void;
  delete(key: string): boolean;
  clearAll(): void;
  clearPattern(pattern: string): number;
  getKeysByPattern(pattern: string): string[];
  getAll(): Map<string, CacheEntry<unknown>>;
  size(): number;
  isReady(): boolean;
}

export interface CacheStoreOptions {
  redisUrl?: string;
  prefix?: string;
  defaultTtl?: number;
}
