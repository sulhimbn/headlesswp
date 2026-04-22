import Redis from 'ioredis';
import type { ICacheManager } from '@/lib/api/ICacheManager';
import type { CacheStatistics, PerformanceMetrics } from './cacheMetricsCalculator';

export const CACHE_ADAPTER = process.env.CACHE_ADAPTER || 'memory';
export const REDIS_URL = process.env.REDIS_URL || '';
export const REDIS_MAX_RETRIES = parseInt(process.env.REDIS_MAX_RETRIES || '3', 10);
export const REDIS_RETRY_DELAY = parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10);
export const REDIS_CONNECT_TIMEOUT = parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10);

export function isRedisConfigured(): boolean {
  return CACHE_ADAPTER === 'redis' && REDIS_URL !== '';
}

interface RedisCacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class RedisCacheManager implements ICacheManager {
  private client: Redis | null = null;
  private isConnected = false;
  private store = new Map<string, string>();
  private dependencyStore = new Map<string, Set<string>>();
  private dependentStore = new Map<string, Set<string>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };

  private dependencyKey = (key: string) => `cache:deps:${key}`;
  private dependentsKey = (key: string) => `cache:dependents:${key}`;
  private dataKey = (key: string) => `cache:data:${key}`;

  constructor() {
    if (CACHE_ADAPTER === 'redis' && REDIS_URL) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    try {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > REDIS_MAX_RETRIES) {
            return null;
          }
          return REDIS_RETRY_DELAY;
        },
        connectTimeout: REDIS_CONNECT_TIMEOUT,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('error', () => {
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  get<T>(key: string): T | null {
    if (!isRedisConfigured()) {
      return this.getFromMemory<T>(key);
    }

    try {
      const entryJson = this.store.get(this.dataKey(key));

      if (!entryJson) {
        this.stats.misses++;
        return null;
      }

      const entry: RedisCacheEntry = JSON.parse(entryJson);

      if (Date.now() - entry.timestamp > entry.ttl) {
        this.invalidate(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data as T;
    } catch {
      this.stats.misses++;
      return null;
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const entryJson = this.store.get(this.dataKey(key));

    if (!entryJson) {
      this.stats.misses++;
      return null;
    }

    const entry: RedisCacheEntry = JSON.parse(entryJson);

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.invalidate(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void {
    if (!isRedisConfigured()) {
      this.setToMemory(key, data, ttl, dependencies);
      return;
    }

    try {
      const entry: RedisCacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      this.store.set(this.dataKey(key), JSON.stringify(entry));

      if (dependencies && dependencies.length > 0) {
        if (!this.dependencyStore.has(key)) {
          this.dependencyStore.set(key, new Set());
        }
        dependencies.forEach(dep => {
          this.dependencyStore.get(key)!.add(dep);
          if (!this.dependentStore.has(dep)) {
            this.dependentStore.set(dep, new Set());
          }
          this.dependentStore.get(dep)!.add(key);
        });
        this.stats.dependencyRegistrations += dependencies.length;
      }

      this.stats.sets++;
    } catch {
      // Silently fail for serverless environments
    }
  }

  private setToMemory<T>(key: string, data: T, ttl: number, dependencies?: string[]): void {
    const entry: RedisCacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.store.set(this.dataKey(key), JSON.stringify(entry));

    if (dependencies && dependencies.length > 0) {
      if (!this.dependencyStore.has(key)) {
        this.dependencyStore.set(key, new Set());
      }
      dependencies.forEach(dep => {
        this.dependencyStore.get(key)!.add(dep);
        if (!this.dependentStore.has(dep)) {
          this.dependentStore.set(dep, new Set());
        }
        this.dependentStore.get(dep)!.add(key);
      });
      this.stats.dependencyRegistrations += dependencies.length;
    }

    this.stats.sets++;
  }

  delete(key: string): boolean {
    const dataKey = this.dataKey(key);
    const exists = this.store.has(dataKey);
    
    if (exists) {
      this.store.delete(dataKey);
      this.store.delete(this.dependencyKey(key));
      this.store.delete(this.dependentsKey(key));
      this.dependencyStore.delete(key);
      this.dependentStore.delete(key);
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  invalidate(key: string): void {
    const keysToInvalidate = new Set<string>([key]);

    const getDependents = (k: string): string[] => {
      const dependents = this.dependentStore.get(k);
      return dependents ? Array.from(dependents) : [];
    };

    let dependents = getDependents(key);
    while (dependents.length > 0) {
      dependents.forEach(dep => keysToInvalidate.add(dep));
      const nextDependents: string[] = [];
      dependents.forEach(dep => nextDependents.push(...getDependents(dep)));
      dependents = nextDependents;
    }

    keysToInvalidate.forEach(k => {
      this.store.delete(this.dataKey(k));
      this.store.delete(this.dependencyKey(k));
      this.store.delete(this.dependentsKey(k));
      this.dependencyStore.delete(k);
    });

    for (const k of keysToInvalidate) {
      const deps = this.dependentStore.get(k);
      if (deps) {
        deps.forEach(dep => {
          const depSet = this.dependentStore.get(dep);
          if (depSet) {
            depSet.delete(k);
          }
        });
      }
    }

    this.stats.cascadeInvalidations += keysToInvalidate.size - 1;
    this.stats.deletes += keysToInvalidate.size;
  }

  clearAll(): void {
    const size = this.store.size;
    this.store.clear();
    this.dependencyStore.clear();
    this.dependentStore.clear();
    this.stats.deletes += size;
  }

  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const matchingKeys: string[] = [];

    this.store.forEach((_, key) => {
      if (regex.test(key)) {
        const dataKey = key.replace(/^cache:data:/, '');
        matchingKeys.push(dataKey);
      }
    });

    const uniqueKeys = [...new Set(matchingKeys)];

    for (const key of uniqueKeys) {
      this.invalidate(key);
    }
  }

  getStats(): CacheStatistics {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      cascadeInvalidations: this.stats.cascadeInvalidations,
      dependencyRegistrations: this.stats.dependencyRegistrations,
      total: this.stats.hits + this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0,
      invalidationRate: this.stats.deletes > 0
        ? (this.stats.cascadeInvalidations / this.stats.deletes) * 100
        : 0,
      size: this.store.size,
      memoryUsageBytes: 0,
      avgTtl: 0,
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const stats = this.getStats();
    return {
      efficiencyScore: stats.hitRate > 80 ? 'high' : stats.hitRate > 50 ? 'medium' : 'low',
      hitRate: stats.hitRate,
      size: stats.size,
      memoryUsageMB: 0,
      cascadeInvalidations: stats.cascadeInvalidations,
      dependencyRegistrations: stats.dependencyRegistrations,
      avgTtlSeconds: 0,
    };
  }

  cleanup(): number {
    return 0;
  }

  cleanupOrphanDependencies(): number {
    return 0;
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      cascadeInvalidations: 0,
      dependencyRegistrations: 0,
    };
  }

  getMemoryUsage(): number {
    let totalSize = 0;
    this.store.forEach((value, key) => {
      totalSize += key.length * 2;
      totalSize += value.length * 2;
    });
    return totalSize;
  }

  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number {
    this.clearPattern(`^${entityType}`);
    return 0;
  }

  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    const keys: string[] = [];

    this.store.forEach((_, key) => {
      const dataKey = key.replace(/^cache:data:/, '');
      if (regex.test(dataKey)) {
        keys.push(dataKey);
      }
    });

    return keys;
  }

  getDependencies(key: string): { dependencies: string[]; dependents: string[] } {
    const deps = this.dependencyStore.get(key);
    const dependents = this.dependentStore.get(key);
    return {
      dependencies: deps ? Array.from(deps) : [],
      dependents: dependents ? Array.from(dependents) : [],
    };
  }

  clear(pattern?: string): void {
    if (pattern) {
      this.clearPattern(pattern);
    } else {
      this.clearAll();
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisCacheManager = new RedisCacheManager();