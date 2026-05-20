import type { CacheEntry } from '../types';
import type { ICacheStore } from './ICacheStore';

export class MemoryCacheStore implements ICacheStore {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set<T>(key: string, entry: CacheEntry<T>): void {
    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
  }

  clearPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  getAll(): Map<string, CacheEntry<unknown>> {
    return new Map(this.cache);
  }

  size(): number {
    return this.cache.size;
  }

  isReady(): boolean {
    return true;
  }
}
