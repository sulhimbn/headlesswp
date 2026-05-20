import Redis from 'ioredis';
import type { ICacheManager } from '@/lib/api/ICacheManager';
import type { CacheStatistics, PerformanceMetrics } from './cacheMetricsCalculator';
import type { CacheEntry } from './types';

export interface RedisCacheOptions {
  host?: string;
  port?: number;
  url?: string;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | null;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  lazyConnect?: boolean;
}

export interface RedisCacheConfig {
  enabled: boolean;
  redis: RedisCacheOptions;
  keyPrefix?: string;
  fallbackToMemory?: boolean;
}

const DEFAULT_REDIS_OPTIONS: RedisCacheOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  enableOfflineQueue: false,
  connectTimeout: 10000,
  lazyConnect: true,
};

const DEFAULT_CONFIG: RedisCacheConfig = {
  enabled: process.env.REDIS_ENABLED === 'true',
  redis: DEFAULT_REDIS_OPTIONS,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'headlesswp:cache:',
  fallbackToMemory: true,
};

interface RedisCacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
  dependencies?: string[];
}

export class RedisCacheAdapter implements ICacheManager {
  private redis: Redis | null = null;
  private config: RedisCacheConfig;
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };
  private isConnected = false;
  private pendingSync: Map<string, Promise<void>> = new Map();

  constructor(config: Partial<RedisCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeRedis();
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix || ''}${key}`;
  }

  private parseEntry(raw: string | null): RedisCacheEntry | null {
    if (!raw) return null;
    
    try {
      const entry = JSON.parse(raw) as RedisCacheEntry;
      
      if (Date.now() - entry.timestamp > entry.ttl) {
        return null;
      }
      
      return entry;
    } catch {
      return null;
    }
  }

  private initializeRedis(): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      const options: RedisCacheOptions = {
        ...this.config.redis,
        retryStrategy: this.config.redis.retryStrategy || DEFAULT_REDIS_OPTIONS.retryStrategy,
      };
      
      this.redis = new Redis(options);
      
      this.redis.on('connect', () => {
        this.isConnected = true;
        this.syncFromRedis();
      });
      
      this.redis.on('error', () => {
        this.isConnected = false;
      });
      
      this.redis.on('close', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  private async syncFromRedis(): Promise<void> {
    if (!this.redis || !this.isConnected) return;

    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
      const validKeys = keys.filter(k => !k.endsWith(':deps'));

      for (const key of validKeys) {
        const prefix = this.config.keyPrefix || '';
        const cacheKey = key.replace(prefix, '');
        const raw = await this.redis.get(key);
        const entry = this.parseEntry(raw);

        if (entry && !this.cache.has(cacheKey)) {
          this.cache.set(cacheKey, {
            data: entry.data,
            timestamp: entry.timestamp,
            ttl: entry.ttl,
            dependencies: entry.dependencies ? new Set(entry.dependencies) : undefined,
          });
        }
      }
    } catch {
      // Sync failed, continue with local cache
    }
  }

  private async persistToRedis(key: string, entry: CacheEntry<unknown>): Promise<void> {
    if (!this.redis || !this.isConnected) return;

    const redisEntry: RedisCacheEntry = {
      data: entry.data,
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      dependencies: entry.dependencies ? Array.from(entry.dependencies) : undefined,
    };

    try {
      await this.redis.set(
        this.getKey(key),
        JSON.stringify(redisEntry),
        'PX',
        entry.ttl
      );

      if (entry.dependencies && entry.dependencies.size > 0) {
        const dependencyKey = `${this.getKey(key)}:deps`;
        await this.redis.sadd(dependencyKey, ...Array.from(entry.dependencies));
        await this.redis.expire(dependencyKey, Math.ceil(entry.ttl / 1000));
        this.stats.dependencyRegistrations += entry.dependencies.size;
      }
    } catch {
      // Persist failed, continue with local cache
    }
  }

  private async removeFromRedis(key: string): Promise<void> {
    if (!this.redis || !this.isConnected) return;

    try {
      await this.redis.del(this.getKey(key));
      await this.redis.del(`${this.getKey(key)}:deps`);
    } catch {
      // Remove failed
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.invalidate(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    if (dependencies && dependencies.length > 0) {
      entry.dependencies = new Set(dependencies);
    }

    this.cache.set(key, entry);
    this.stats.sets++;

    if (this.config.enabled && this.isConnected) {
      this.persistToRedis(key, entry).catch(() => {});
    }
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.stats.deletes++;
      
      if (this.config.enabled && this.isConnected) {
        this.removeFromRedis(key).catch(() => {});
      }
    }
    
    return deleted;
  }

  invalidate(key: string): void {
    const entry = this.cache.get(key);
    const dependents = this.getDependents(key);
    const keysToInvalidate = [key, ...dependents];

    for (const k of keysToInvalidate) {
      const deleted = this.cache.delete(k);
      if (deleted) {
        this.stats.cascadeInvalidations++;
        
        if (this.config.enabled && this.isConnected) {
          this.removeFromRedis(k).catch(() => {});
        }
      }
    }

    if (entry?.dependencies) {
      for (const dep of entry.dependencies) {
        const depEntry = this.cache.get(dep);
        if (depEntry?.dependents) {
          depEntry.dependents.delete(key);
        }
      }
    }
  }

  private getDependents(key: string): string[] {
    const dependents: string[] = [];
    
    this.cache.forEach((entry, cacheKey) => {
      if (entry.dependencies?.has(key)) {
        dependents.push(cacheKey);
      }
    });

    return dependents;
  }

  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;

    if (this.config.enabled && this.isConnected && this.redis) {
      this.redis.keys(`${this.config.keyPrefix}*`).then(keys => {
        if (keys.length > 0) {
          this.redis!.del(...keys).catch(() => {});
        }
      }).catch(() => {});
    }
  }

  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.invalidate(key));
  }

  getStats(): CacheStatistics {
    let memoryUsageBytes = 0;
    let avgTtl = 0;

    if (this.cache.size > 0) {
    this.cache.forEach((entry, cacheKey) => {
        memoryUsageBytes += cacheKey.length * 2;
        memoryUsageBytes += JSON.stringify(entry.data).length * 2;
        avgTtl += entry.ttl;
      });
      avgTtl = Math.round(avgTtl / this.cache.size);
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const invalidationRate = this.stats.deletes > 0
      ? (this.stats.cascadeInvalidations / this.stats.deletes) * 100
      : 0;

    return {
      ...this.stats,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      invalidationRate: Math.round(invalidationRate * 100) / 100,
      size: this.cache.size,
      memoryUsageBytes,
      avgTtl,
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const stats = this.getStats();
    const efficiencyScore = stats.hitRate > 80 ? 'high' : stats.hitRate > 50 ? 'medium' : 'low';

    return {
      efficiencyScore,
      hitRate: stats.hitRate,
      size: stats.size,
      memoryUsageMB: Math.round(stats.memoryUsageBytes / 1024 / 1024 * 100) / 100,
      cascadeInvalidations: stats.cascadeInvalidations,
      dependencyRegistrations: stats.dependencyRegistrations,
      avgTtlSeconds: Math.round(stats.avgTtl / 1000),
    };
  }

  cleanup(): number {
    let cleaned = 0;
    
    this.cache.forEach((entry, key) => {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
        
        if (this.config.enabled && this.isConnected) {
          this.removeFromRedis(key).catch(() => {});
        }
      }
    });

    this.stats.deletes += cleaned;
    return cleaned;
  }

  cleanupOrphanDependencies(): number {
    let cleaned = 0;
    
    this.cache.forEach((entry) => {
      if (entry.dependencies) {
        for (const dep of entry.dependencies) {
          if (!this.cache.has(dep)) {
            entry.dependencies.delete(dep);
            cleaned++;
          }
        }
      }
    });

    return cleaned;
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
    
    this.cache.forEach((entry, key) => {
      totalSize += key.length * 2;
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += entry.dependencies ? entry.dependencies.size * 50 : 0;
      totalSize += entry.dependents ? entry.dependents.size * 50 : 0;
      totalSize += 24;
    });

    return totalSize;
  }

  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number {
    const pattern = new RegExp(`^${entityType}`);
    let invalidated = 0;

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        this.invalidate(key);
        invalidated++;
      }
    });

    return invalidated;
  }

  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  getDependencies(key: string): { dependencies: string[]; dependents: string[] } {
    const entry = this.cache.get(key);
    const dependencies = entry?.dependencies ? Array.from(entry.dependencies) : [];
    const dependents = this.getDependents(key);

    return { dependencies, dependents };
  }

  clear(pattern?: string): void {
    if (pattern) {
      this.clearPattern(pattern);
    } else {
      this.clearAll();
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  isRedisEnabled(): boolean {
    return this.config.enabled;
  }
}

export function createRedisCacheAdapter(config?: Partial<RedisCacheConfig>): RedisCacheAdapter {
  return new RedisCacheAdapter(config);
}
