import Redis from 'ioredis';
import type { ICacheManager } from '@/lib/api/ICacheManager';
import type { CacheEntry, CacheTelemetry } from './types';
import type { CacheStatistics, PerformanceMetrics } from './cacheMetricsCalculator';

export type CacheAdapterType = 'memory' | 'redis';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectionName?: string;
  retryStrategy?: (times: number) => number | null;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
}

export interface RedisMetrics {
  connected: boolean;
  reconnectAttempts: number;
  lastConnectedAt: number | null;
  lastErrorAt: number | null;
  lastErrorMessage: string | null;
  commandsExecuted: number;
  commandsFailed: number;
}

export class RedisCacheAdapter implements ICacheManager {
  private client: Redis | null = null;
  private config: RedisConfig;
  private stats: CacheTelemetry = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };
  private redisMetrics: RedisMetrics = {
    connected: false,
    reconnectAttempts: 0,
    lastConnectedAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    commandsExecuted: 0,
    commandsFailed: 0,
  };
  private dependencyStore: Map<string, { dependencies: string[]; dependents: string[] }> = new Map();

  constructor(config: RedisConfig = {}) {
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379', 10),
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: config.keyPrefix || process.env.REDIS_KEY_PREFIX || 'cache:',
      connectionName: config.connectionName || 'headlesswp-cache',
      retryStrategy: config.retryStrategy || this.defaultRetryStrategy,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
      enableReadyCheck: config.enableReadyCheck ?? true,
      enableOfflineQueue: config.enableOfflineQueue ?? false,
      connectTimeout: config.connectTimeout ?? 10000,
      commandTimeout: config.commandTimeout ?? 5000,
    };
  }

  private defaultRetryStrategy(times: number): number | null {
    if (times > 10) return null;
    const delay = Math.min(times * 200, 3000);
    return delay;
  }

  async connect(): Promise<void> {
    if (this.client) return;

    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      connectionName: this.config.connectionName,
      retryStrategy: this.config.retryStrategy,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      enableReadyCheck: this.config.enableReadyCheck,
      enableOfflineQueue: this.config.enableOfflineQueue,
      connectTimeout: this.config.connectTimeout,
      commandTimeout: this.config.commandTimeout,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.redisMetrics.connected = true;
      this.redisMetrics.lastConnectedAt = Date.now();
      this.redisMetrics.reconnectAttempts = 0;
      console.log(`[Redis] Connected to ${this.config.host}:${this.config.port}`);
    });

    this.client.on('error', (err: Error) => {
      this.redisMetrics.lastErrorAt = Date.now();
      this.redisMetrics.lastErrorMessage = err.message;
      console.error(`[Redis] Error:`, err.message);
    });

    this.client.on('close', () => {
      this.redisMetrics.connected = false;
      console.log('[Redis] Connection closed');
    });

    this.client.on('reconnecting', () => {
      this.redisMetrics.reconnectAttempts++;
      console.log(`[Redis] Reconnecting... attempt ${this.redisMetrics.reconnectAttempts}`);
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.redisMetrics.connected = false;
    }
  }

  isConnected(): boolean {
    return this.redisMetrics.connected;
  }

  getRedisMetrics(): RedisMetrics {
    return { ...this.redisMetrics };
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }

    try {
      this.redisMetrics.commandsExecuted++;
      const value = await this.client.get(this.config.keyPrefix + key);

      if (!value) {
        this.stats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(value);

      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.invalidate(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data;
    } catch (error) {
      this.redisMetrics.commandsFailed++;
      console.error(`[Redis] GET error for key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number, dependencies?: string[]): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }

    try {
      this.redisMetrics.commandsExecuted++;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const fullKey = this.config.keyPrefix + key;
      await this.client.setex(fullKey, Math.ceil(ttl / 1000), JSON.stringify(entry));

      if (dependencies && dependencies.length > 0) {
        this.dependencyStore.set(key, { dependencies, dependents: [] });
        for (const dep of dependencies) {
          const existing = this.dependencyStore.get(dep);
          if (existing) {
            existing.dependents.push(key);
            this.dependencyStore.set(dep, existing);
          } else {
            this.dependencyStore.set(dep, { dependencies: [], dependents: [key] });
          }
        }
        this.stats.dependencyRegistrations += dependencies.length;
      }

      this.stats.sets++;
    } catch (error) {
      this.redisMetrics.commandsFailed++;
      console.error(`[Redis] SET error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }

    try {
      this.redisMetrics.commandsExecuted++;
      const result = await this.client.del(this.config.keyPrefix + key);
      this.dependencyStore.delete(key);
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }
      return false;
    } catch (error) {
      this.redisMetrics.commandsFailed++;
      console.error(`[Redis] DELETE error for key ${key}:`, error);
      return false;
    }
  }

  async invalidate(key: string): Promise<void> {
    const toInvalidate = new Set<string>([key]);

    const collectDependents = (k: string) => {
      const deps = this.dependencyStore.get(k);
      if (deps && deps.dependents) {
        for (const dependent of deps.dependents) {
          if (!toInvalidate.has(dependent)) {
            toInvalidate.add(dependent);
            collectDependents(dependent);
          }
        }
      }
    };

    collectDependents(key);

    for (const k of toInvalidate) {
      await this.delete(k);
      this.stats.cascadeInvalidations++;
    }
  }

  async clearAll(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }

    try {
      this.redisMetrics.commandsExecuted++;
      const keys = await this.client.keys(this.config.keyPrefix + '*');
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.stats.deletes += keys.length;
      }
      this.dependencyStore.clear();
    } catch (error) {
      this.redisMetrics.commandsFailed++;
      console.error('[Redis] CLEARALL error:', error);
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }

    try {
      this.redisMetrics.commandsExecuted++;
      const regex = new RegExp(pattern);
      const keys = await this.client.keys(this.config.keyPrefix + '*');
      const prefix = this.config.keyPrefix || '';
      const matchingKeys = keys.filter(key => regex.test(key.replace(prefix, '')));

      for (const key of matchingKeys) {
        await this.invalidate(key.replace(prefix, ''));
      }
    } catch (error) {
      this.redisMetrics.commandsFailed++;
      console.error(`[Redis] CLEARPATTERN error:`, error);
    }
  }

  async getStats(): Promise<CacheStatistics> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const invalidationRate = this.stats.deletes > 0
      ? (this.stats.cascadeInvalidations / this.stats.deletes) * 100
      : 0;

    let size = 0;
    if (this.client) {
      try {
        this.redisMetrics.commandsExecuted++;
        const keys = await this.client.keys(this.config.keyPrefix + '*');
        size = keys.length;
      } catch {
        this.redisMetrics.commandsFailed++;
      }
    }

    return {
      ...this.stats,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      invalidationRate: Math.round(invalidationRate * 100) / 100,
      size,
      memoryUsageBytes: 0,
      avgTtl: 0,
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const stats = await this.getStats();
    const efficiencyScore = stats.hitRate > 80 ? 'high' : stats.hitRate > 50 ? 'medium' : 'low';

    return {
      efficiencyScore,
      hitRate: stats.hitRate,
      size: stats.size,
      memoryUsageMB: 0,
      cascadeInvalidations: stats.cascadeInvalidations,
      dependencyRegistrations: stats.dependencyRegistrations,
      avgTtlSeconds: 0,
    };
  }

  async cleanup(): Promise<number> {
    return 0;
  }

  async cleanupOrphanDependencies(): Promise<number> {
    let cleaned = 0;
    const validKeys = new Set<string>();

    if (this.client) {
      try {
        this.redisMetrics.commandsExecuted++;
        const prefix = this.config.keyPrefix || '';
        const keys = await this.client.keys(prefix + '*');
        for (const key of keys) {
          validKeys.add(key.replace(prefix, ''));
        }
      } catch {
        this.redisMetrics.commandsFailed++;
      }
    }

    for (const [depKey, deps] of this.dependencyStore.entries()) {
      if (!validKeys.has(depKey)) {
        this.dependencyStore.delete(depKey);
        cleaned++;
        continue;
      }

      const validDeps = deps.dependencies.filter(d => validKeys.has(d));
      const validDependents = deps.dependents.filter(d => validKeys.has(d));

      if (validDeps.length !== deps.dependencies.length || validDependents.length !== deps.dependents.length) {
        this.dependencyStore.set(depKey, { dependencies: validDeps, dependents: validDependents });
        cleaned++;
      }
    }

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
    return 0;
  }

  async invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): Promise<number> {
    const pattern = new RegExp(`^${entityType}`);
    let invalidated = 0;

    if (this.client) {
      try {
        this.redisMetrics.commandsExecuted++;
        const prefix = this.config.keyPrefix || '';
        const keys = await this.client.keys(prefix + '*');
        for (const key of keys) {
          const keyWithoutPrefix = key.replace(prefix, '');
          if (pattern.test(keyWithoutPrefix)) {
            await this.invalidate(keyWithoutPrefix);
            invalidated++;
          }
        }
      } catch {
        this.redisMetrics.commandsFailed++;
      }
    }

    return invalidated;
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }

    try {
      this.redisMetrics.commandsExecuted++;
      const regex = new RegExp(pattern);
      const prefix = this.config.keyPrefix || '';
      const keys = await this.client.keys(prefix + '*');
      return keys
        .map(key => key.replace(prefix, ''))
        .filter(key => regex.test(key));
    } catch (error) {
      this.redisMetrics.commandsFailed++;
      console.error(`[Redis] GETKEYSBYPATTERN error:`, error);
      return [];
    }
  }

  async getDependencies(key: string): Promise<{ dependencies: string[]; dependents: string[] }> {
    const deps = this.dependencyStore.get(key);
    return deps || { dependencies: [], dependents: [] };
  }

  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      await this.clearPattern(pattern);
    } else {
      await this.clearAll();
    }
  }
}
