import Redis, { type RedisOptions } from 'ioredis';
import type { ICacheManager } from '@/lib/api/ICacheManager';
import type { CacheEntry, CacheTelemetry } from './types';
import type { CacheStatistics, PerformanceMetrics } from './cacheMetricsCalculator';
import { CacheMetricsCalculator } from './cacheMetricsCalculator';

export interface RedisCacheConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectTimeout?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

export interface RedisCacheOptions {
  config: RedisCacheConfig;
  defaultTtl: number;
  enableFallback: boolean;
}

interface RedisCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class RedisCacheAdapter implements ICacheManager {
  private client: Redis | null = null;
  private config: RedisCacheConfig;
  private defaultTtl: number;
  private enableFallback: boolean;
  private fallbackCache = new Map<string, CacheEntry<unknown>>();
  private isConnected: boolean = false;
  private connectionError: Error | null = null;
  private metricsCalculator = new CacheMetricsCalculator();
  private stats: CacheTelemetry = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };

  constructor(options: RedisCacheOptions) {
    this.config = options.config;
    this.defaultTtl = options.defaultTtl;
    this.enableFallback = options.enableFallback;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      const redisOptions: RedisOptions = {
        host: this.config.host || 'localhost',
        port: this.config.port || 6379,
        password: this.config.password,
        db: this.config.db || 0,
        keyPrefix: this.config.keyPrefix || 'headlesswp:',
        connectTimeout: this.config.connectTimeout || 5000,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
        enableReadyCheck: this.config.enableReadyCheck !== false,
        lazyConnect: this.config.lazyConnect !== false,
        retryStrategy: (times: number): number | null => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        reconnectOnError: (): boolean => {
          return true;
        },
      };

      if (this.config.url) {
        Object.assign(redisOptions, { url: this.config.url });
      }

      this.client = new Redis(redisOptions);

      this.client.on('error', (err: Error) => {
        this.connectionError = err;
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionError = null;
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.connectionError = error as Error;
      this.isConnected = false;
      if (!this.enableFallback) {
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  getLastError(): Error | null {
    return this.connectionError;
  }

  useFallback(): boolean {
    return this.enableFallback && !this.isConnected;
  }

  private getClient(): Redis | null {
    if (this.useFallback()) {
      return null;
    }
    return this.client;
  }

  get<T>(key: string): T | null {
    const client = this.getClient();

    if (!client) {
      return this.getFromFallback<T>(key);
    }

    try {
      const value = client.get(this.getPrefixedKey(key));
      
      if (typeof value === 'string') {
        const parsed: RedisCacheEntry<T> = JSON.parse(value);
        const now = Date.now();

        if (now - parsed.timestamp > parsed.ttl) {
          this.delete(key);
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        return parsed.data;
      }

      this.stats.misses++;
      return null;
    } catch {
      this.stats.misses++;
      if (this.enableFallback) {
        return this.getFromFallback<T>(key);
      }
      return null;
    }
  }

  set<T>(key: string, data: T, ttl: number, _dependencies?: string[]): void {
    const client = this.getClient();

    if (!client) {
      this.setToFallback(key, data, ttl);
      return;
    }

    try {
      const entry: RedisCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      client.set(
        this.getPrefixedKey(key),
        JSON.stringify(entry),
        'EX',
        Math.ceil(ttl / 1000)
      );

      this.stats.sets++;
    } catch {
      if (this.enableFallback) {
        this.setToFallback(key, data, ttl);
      }
    }
  }

  delete(key: string): boolean {
    const client = this.getClient();

    if (!client) {
      return this.deleteFromFallback(key);
    }

    try {
      client.del(this.getPrefixedKey(key));
      this.stats.deletes++;
      return true;
    } catch {
      if (this.enableFallback) {
        return this.deleteFromFallback(key);
      }
      return false;
    }
  }

  invalidate(key: string): void {
    this.delete(key);
  }

  clearAll(): void {
    const client = this.getClient();

    if (!client) {
      this.fallbackCache.clear();
      return;
    }

    try {
      client.keys(this.getPrefixedKey('*')).then((keyList) => {
        if (keyList && keyList.length > 0) {
          client.del(...keyList);
          this.stats.deletes += keyList.length;
        }
      }).catch(() => {
        if (this.enableFallback) {
          this.fallbackCache.clear();
        }
      });
    } catch {
      if (this.enableFallback) {
        this.fallbackCache.clear();
      }
    }
  }

  clearPattern(pattern: string): void {
    const client = this.getClient();

    if (!client) {
      const regex = new RegExp(pattern);
      const keysToDelete: string[] = [];
      this.fallbackCache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.deleteFromFallback(key));
      return;
    }

    try {
      const regex = new RegExp(pattern);
      client.keys(this.getPrefixedKey('*')).then((keyList) => {
        if (keyList && keyList.length > 0) {
          const matchingKeys = keyList.filter((key: string) => {
            const strippedKey = this.stripPrefix(key);
            return regex.test(strippedKey);
          });

          if (matchingKeys.length > 0) {
            client.del(...matchingKeys);
            this.stats.deletes += matchingKeys.length;
          }
        }
      }).catch(() => {
        if (this.enableFallback) {
          const regex = new RegExp(pattern);
          const keysToDelete: string[] = [];
          this.fallbackCache.forEach((_, key) => {
            if (regex.test(key)) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach(key => this.deleteFromFallback(key));
        }
      });
    } catch {
      if (this.enableFallback) {
        const regex = new RegExp(pattern);
        const keysToDelete: string[] = [];
        this.fallbackCache.forEach((_, key) => {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => this.deleteFromFallback(key));
      }
    }
  }

  getStats(): CacheStatistics {
    const memoryUsageBytes = this.calculateFallbackMemoryUsage();
    const avgTtl = this.calculateFallbackAverageTtl();

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
    return this.calculateFallbackMemoryUsage();
  }

  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number {
    const pattern = `^${entityType}`;
    this.clearPattern(pattern);
    return 0;
  }

  getKeysByPattern(pattern: string): string[] {
    const client = this.getClient();

    if (!client) {
      const regex = new RegExp(pattern);
      return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
    }

    client.keys(this.getPrefixedKey('*')).then((keyList) => {
      if (!keyList) {
        return [];
      }

      const regex = new RegExp(pattern);
      return keyList
        .map((key: string) => this.stripPrefix(key))
        .filter((key: string) => regex.test(key));
    }).catch(() => {
      if (this.enableFallback) {
        const regex = new RegExp(pattern);
        return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
      }
      return [];
    });

    return [];
  }

  getDependencies(key: string): { dependencies: string[]; dependents: string[] } {
    const client = this.getClient();

    if (!client) {
      const entry = this.fallbackCache.get(key);
      return {
        dependencies: entry?.dependencies ? Array.from(entry.dependencies) : [],
        dependents: entry?.dependents ? Array.from(entry.dependents) : [],
      };
    }

    return { dependencies: [], dependents: [] };
  }

  clear(pattern?: string): void {
    if (pattern) {
      this.clearPattern(pattern);
    } else {
      this.clearAll();
    }
  }

  private getPrefixedKey(key: string): string {
    const prefix = this.config.keyPrefix || 'headlesswp:';
    return `${prefix}${key}`;
  }

  private stripPrefix(key: string): string {
    const prefix = this.config.keyPrefix || 'headlesswp:';
    if (key.startsWith(prefix)) {
      return key.slice(prefix.length);
    }
    return key;
  }

  private getFromFallback<T>(key: string): T | null {
    const entry = this.fallbackCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.fallbackCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  private setToFallback<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.fallbackCache.set(key, entry);
    this.stats.sets++;
  }

  private deleteFromFallback(key: string): boolean {
    const deleted = this.fallbackCache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  private calculateFallbackMemoryUsage(): number {
    let totalSize = 0;
    this.fallbackCache.forEach((entry, key) => {
      totalSize += key.length * 2;
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += entry.dependencies ? entry.dependencies.size * 50 : 0;
      totalSize += entry.dependents ? entry.dependents.size * 50 : 0;
      totalSize += 24;
    });
    return totalSize;
  }

  private calculateFallbackAverageTtl(): number {
    if (this.fallbackCache.size === 0) {
      return 0;
    }

    let totalTtl = 0;
    this.fallbackCache.forEach((entry) => {
      totalTtl += entry.ttl;
    });

    return totalTtl / this.fallbackCache.size;
  }
}

export function createRedisCacheAdapter(config?: RedisCacheConfig): RedisCacheAdapter {
  const defaultConfig: RedisCacheOptions = {
    config: config || {},
    defaultTtl: 60000,
    enableFallback: true,
  };

  return new RedisCacheAdapter(defaultConfig);
}
