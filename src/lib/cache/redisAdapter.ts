import Redis from 'ioredis';
import type { ICacheManager } from '@/lib/api/ICacheManager';
import type { CacheEntry } from './types';
import type { CacheStatistics, PerformanceMetrics } from './cacheMetricsCalculator';
import { REDIS_CONFIG, type RedisConfig } from './redisConfig';
import { CacheDependencyManager } from './cacheDependencyManager';
import { CacheMetricsCalculator } from './cacheMetricsCalculator';
import { CacheCleanup } from './cacheCleanup';
import { logger } from '@/lib/utils/logger';

interface RedisCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: string[];
}

export class RedisCacheAdapter implements ICacheManager {
  private redis: Redis | null = null;
  private fallbackCache = new Map<string, CacheEntry<unknown>>();
  private config: RedisConfig;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries: number;
  private dependencyManager: CacheDependencyManager;
  private cacheCleanup: CacheCleanup;
  private metricsCalculator: CacheMetricsCalculator;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };
  private useFallback = false;
  private syncTimeout: NodeJS.Timeout | null = null;

  constructor(config: RedisConfig = REDIS_CONFIG) {
    this.config = config;
    this.maxRetries = config.retryStrategy?.maxRetries ?? 3;
    this.dependencyManager = new CacheDependencyManager(this.fallbackCache);
    this.cacheCleanup = new CacheCleanup(this.fallbackCache);
    this.metricsCalculator = new CacheMetricsCalculator();

    if (this.config.enabled) {
      this.initializeRedis();
    } else {
      this.useFallback = true;
    }
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis(this.config.url, {
        maxRetriesPerRequest: this.maxRetries,
        retryStrategy: (times: number) => {
          this.connectionAttempts = times;
          if (times > this.maxRetries) {
            console.error(`[RedisCacheAdapter] Max retries (${this.maxRetries}) reached. Using fallback cache.`);
            this.useFallback = true;
            return null;
          }
          const delay = Math.min(times * (this.config.retryStrategy?.retryInterval ?? 1000), 5000);
          console.warn(`[RedisCacheAdapter] Connection attempt ${times}/${this.maxRetries}, retrying in ${delay}ms...`);
          return delay;
        },
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      this.redis.on('connect', () => {
        logger.info('[RedisCacheAdapter] Connected to Redis');
        this.isConnected = true;
        this.useFallback = false;
        this.syncFromRedis();
      });

      this.redis.on('error', (err) => {
        console.error('[RedisCacheAdapter] Redis error:', err.message);
        this.isConnected = false;
        this.useFallback = true;
      });

      this.redis.on('close', () => {
        console.warn('[RedisCacheAdapter] Redis connection closed');
        this.isConnected = false;
        this.useFallback = true;
      });

      this.redis.connect().catch((err) => {
        console.error('[RedisCacheAdapter] Failed to connect to Redis:', err.message);
        this.useFallback = true;
      });
    } catch (error) {
      console.error('[RedisCacheAdapter] Failed to initialize Redis:', error);
      this.useFallback = true;
    }
  }

  private getFullKey(key: string): string {
    return `${this.config.keyPrefix ?? ''}${key}`;
  }

  private serializeEntry<T>(entry: RedisCacheEntry<T>): string {
    return JSON.stringify(entry);
  }

  private deserializeEntry<T>(data: string | null): RedisCacheEntry<T> | null {
    if (!data) return null;
    try {
      return JSON.parse(data) as RedisCacheEntry<T>;
    } catch {
      return null;
    }
  }

  private syncToRedis(key: string, entry: CacheEntry<unknown>): void {
    if (this.useFallback || !this.redis || !this.isConnected) return;

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(async () => {
      try {
        const redisEntry: RedisCacheEntry<unknown> = {
          data: entry.data,
          timestamp: entry.timestamp,
          ttl: entry.ttl,
          dependencies: entry.dependencies ? Array.from(entry.dependencies) : undefined,
        };

        const fullKey = this.getFullKey(key);
        await this.redis!.setex(fullKey, Math.ceil(entry.ttl / 1000), this.serializeEntry(redisEntry));

        if (redisEntry.dependencies) {
          await this.storeDependencies(key, redisEntry.dependencies);
        }
      } catch (error) {
        console.error('[RedisCacheAdapter] Error syncing to Redis:', error);
      }
    }, 100);
  }

  private deleteFromRedis(key: string): void {
    if (this.useFallback || !this.redis || !this.isConnected) return;

    setTimeout(async () => {
      try {
        const fullKey = this.getFullKey(key);
        await this.redis!.del(fullKey);
        await this.removeDependencyReferences(key);
      } catch (error) {
        console.error('[RedisCacheAdapter] Error deleting from Redis:', error);
      }
    }, 100);
  }

  private async syncFromRedis(): Promise<void> {
    if (this.useFallback || !this.redis || !this.isConnected) return;

    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix ?? ''}*`);
      
      for (const key of keys) {
        if (key.endsWith(':deps') || key.endsWith(':dependents')) continue;

        const data = await this.redis.get(key);
        if (data) {
          const entry = this.deserializeEntry(data);
          if (entry) {
            const cacheKey = key.replace(this.config.keyPrefix ?? '', '');
            const cacheEntry: CacheEntry<unknown> = {
              data: entry.data,
              timestamp: entry.timestamp,
              ttl: entry.ttl,
              dependencies: entry.dependencies ? new Set(entry.dependencies) : undefined,
            };
            
            if (!this.fallbackCache.has(cacheKey)) {
              this.fallbackCache.set(cacheKey, cacheEntry);
            }
          }
        }
      }

      logger.info(`[RedisCacheAdapter] Synced ${this.fallbackCache.size} entries from Redis`);
    } catch (error) {
      console.error('[RedisCacheAdapter] Error syncing from Redis:', error);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.fallbackCache.get(key) as CacheEntry<T> | undefined;
    
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
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    if (dependencies) {
      entry.dependencies = new Set(dependencies);
    }

    this.fallbackCache.set(key, entry);

    if (dependencies && dependencies.length > 0) {
      this.dependencyManager.registerDependencies(key, dependencies, this.stats);
    }

    this.stats.sets++;

    this.syncToRedis(key, entry);
  }

  delete(key: string): boolean {
    const deleted = this.fallbackCache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    this.deleteFromRedis(key);
    return deleted;
  }

  invalidate(key: string): void {
    const keysToInvalidate = new Set<string>();
    keysToInvalidate.add(key);

    const findDependents = (k: string) => {
      const entry = this.fallbackCache.get(k);
      if (entry?.dependents) {
        entry.dependents.forEach((dep) => {
          if (!keysToInvalidate.has(dep)) {
            keysToInvalidate.add(dep);
            findDependents(dep);
          }
        });
      }
    };

    findDependents(key);

    keysToInvalidate.forEach((k) => {
      this.fallbackCache.delete(k);
      this.stats.cascadeInvalidations++;
      this.deleteFromRedis(k);
    });

    this.stats.deletes += keysToInvalidate.size;
  }

  clearAll(): void {
    const size = this.fallbackCache.size;
    this.fallbackCache.clear();
    this.stats.deletes += size;

    if (this.useFallback || !this.redis || !this.isConnected) return;

    setTimeout(async () => {
      try {
        const keys = await this.redis!.keys(`${this.config.keyPrefix ?? ''}*`);
        if (keys.length > 0) {
          await this.redis!.del(...keys);
        }
      } catch (error) {
        console.error('[RedisCacheAdapter] Error clearing Redis:', error);
      }
    }, 100);
  }

  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.fallbackCache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.invalidate(key));
  }

  getStats(): CacheStatistics {
    const memoryUsageBytes = this.metricsCalculator.calculateMemoryUsage(this.fallbackCache);
    const avgTtl = this.metricsCalculator.calculateAverageTtl(this.fallbackCache);

    return this.metricsCalculator.calculateStatistics(
      this.stats,
      this.fallbackCache.size,
      memoryUsageBytes,
      avgTtl
    );
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const stats = this.getStats();
    return this.metricsCalculator.calculatePerformanceMetrics(stats);
  }

  cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.fallbackCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.fallbackCache.delete(key);
      this.deleteFromRedis(key);
    });
    
    this.stats.deletes += keysToDelete.length;
    return keysToDelete.length;
  }

  cleanupOrphanDependencies(): number {
    return this.cacheCleanup.cleanupOrphanDependencies();
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
    return this.metricsCalculator.calculateMemoryUsage(this.fallbackCache);
  }

  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number {
    const pattern = new RegExp(`^${entityType}`);
    let invalidated = 0;

    this.fallbackCache.forEach((_, key) => {
      if (pattern.test(key)) {
        this.invalidate(key);
        invalidated++;
      }
    });

    return invalidated;
  }

  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
  }

  getDependencies(key: string): { dependencies: string[]; dependents: string[] } {
    return this.dependencyManager.getDependencies(key);
  }

  clear(pattern?: string): void {
    if (pattern) {
      this.clearPattern(pattern);
    } else {
      this.clearAll();
    }
  }

  private async storeDependencies(key: string, dependencies: string[]): Promise<void> {
    const depKey = `${this.getFullKey(key)}:deps`;
    try {
      await this.redis?.setex(depKey, 86400, JSON.stringify(dependencies));
      
      for (const dep of dependencies) {
        const depFullKey = this.getFullKey(dep);
        const dependentSetKey = `${depFullKey}:dependents`;
        const existing = await this.redis?.get(dependentSetKey);
        const dependents = existing ? JSON.parse(existing) as string[] : [];
        if (!dependents.includes(key)) {
          dependents.push(key);
          await this.redis?.setex(dependentSetKey, 86400, JSON.stringify(dependents));
        }
      }
    } catch (error) {
      console.error('[RedisCacheAdapter] Error storing dependencies:', error);
    }
  }

  private async removeDependencyReferences(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const depKey = `${fullKey}:deps`;
      const depsData = await this.redis?.get(depKey);
      
      if (depsData) {
        const dependencies = JSON.parse(depsData) as string[];
        for (const dep of dependencies) {
          const depFullKey = this.getFullKey(dep);
          const dependentSetKey = `${depFullKey}:dependents`;
          const existing = await this.redis?.get(dependentSetKey);
          if (existing) {
            const dependents = JSON.parse(existing) as string[];
            const filtered = dependents.filter((d) => d !== key);
            if (filtered.length > 0) {
              await this.redis?.setex(dependentSetKey, 86400, JSON.stringify(filtered));
            } else {
              await this.redis?.del(dependentSetKey);
            }
          }
        }
        await this.redis?.del(depKey);
      }
    } catch (error) {
      console.error('[RedisCacheAdapter] Error removing dependency references:', error);
    }
  }

  isUsingFallback(): boolean {
    return this.useFallback;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }
}

let redisCacheAdapter: RedisCacheAdapter | null = null;

export function getRedisCacheAdapter(): RedisCacheAdapter {
  if (!redisCacheAdapter) {
    redisCacheAdapter = new RedisCacheAdapter();
  }
  return redisCacheAdapter;
}

export const redisCacheManager = getRedisCacheAdapter();
