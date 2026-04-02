import type { ICacheStore, CacheStoreOptions } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: string[];
  dependents?: string[];
}

export class InMemoryCacheStore implements ICacheStore {
  private cache = new Map<string, CacheEntry<unknown>>();
  private prefix: string;
  private defaultTtl: number;

  constructor(options: CacheStoreOptions = {}) {
    this.prefix = options.prefix || '';
    this.defaultTtl = options.defaultTtl || 60000;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(this.prefix + key);
    
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
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(this.prefix + key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(this.prefix + key);
  }

  async clearAll(): Promise<void> {
    this.cache.clear();
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern);
    const prefixRegex = new RegExp('^' + this.prefix);
    return Array.from(this.cache.keys())
      .filter(key => regex.test(key.replace(prefixRegex, '')));
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    this.cache.clear();
  }

  isConnected(): boolean {
    return true;
  }

  async registerDependencies(
    key: string,
    dependencies: string[]
  ): Promise<void> {
    const entry = this.cache.get(this.prefix + key);
    if (entry) {
      entry.dependencies = dependencies;
    }

    for (const depKey of dependencies) {
      const depEntry = this.cache.get(this.prefix + depKey);
      if (depEntry) {
        if (!depEntry.dependents) {
          depEntry.dependents = [];
        }
        if (!depEntry.dependents.includes(key)) {
          depEntry.dependents.push(key);
        }
      }
    }
  }

  async getDependencies(key: string): Promise<{ dependencies: string[]; dependents: string[] }> {
    const entry = this.cache.get(this.prefix + key);
    if (!entry) {
      return { dependencies: [], dependents: [] };
    }
    return {
      dependencies: entry.dependencies || [],
      dependents: entry.dependents || [],
    };
  }

  async invalidateWithDependents(key: string): Promise<number> {
    let invalidated = 0;
    const toInvalidate: string[] = [key];
    
    while (toInvalidate.length > 0) {
      const currentKey = toInvalidate.pop()!;
      const entry = this.cache.get(this.prefix + currentKey);
      
      if (entry) {
        if (entry.dependents && entry.dependents.length > 0) {
          for (const dep of entry.dependents) {
            if (!toInvalidate.includes(dep)) {
              toInvalidate.push(dep);
            }
          }
        }
        
        this.cache.delete(this.prefix + currentKey);
        invalidated++;
      }
    }
    
    return invalidated;
  }
}

export function createInMemoryStore(options?: CacheStoreOptions): InMemoryCacheStore {
  return new InMemoryCacheStore(options);
}