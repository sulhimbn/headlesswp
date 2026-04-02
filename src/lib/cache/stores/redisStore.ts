import Redis, { type RedisOptions } from 'ioredis';
import type { ICacheStore, CacheStoreOptions, RedisConfig, CacheStoreHealth } from '../types';

interface StoredCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: string[];
  dependents?: string[];
}

export class RedisCacheStore implements ICacheStore {
  private redis: Redis | null = null;
  private prefix: string;
  private defaultTtl: number;
  private retryAttempts: number;
  private retryDelay: number;
  private connected: boolean = false;
  private connecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private onConnectionError: ((error: Error) => void) | null = null;

  constructor(
    private config: RedisConfig = {},
    options: CacheStoreOptions = {}
  ) {
    this.prefix = options.prefix || 'cache:';
    this.defaultTtl = options.defaultTtl || 60000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  private getRedisUrl(): string | null {
    if (this.config.url) {
      return this.config.url;
    }
    if (process.env.REDIS_URL) {
      return process.env.REDIS_URL;
    }
    return null;
  }

  private async ensureConnection(): Promise<Redis> {
    if (this.redis && this.connected) {
      return this.redis;
    }

    if (this.connecting && this.connectionPromise) {
      await this.connectionPromise;
      if (this.redis && this.connected) {
        return this.redis;
      }
    }

    this.connecting = true;
    this.connectionPromise = this.initializeConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.connecting = false;
    }

    if (!this.redis || !this.connected) {
      throw new Error('Failed to connect to Redis');
    }

    return this.redis!;
  }

  private async initializeConnection(): Promise<void> {
    const redisUrl = this.getRedisUrl();
    
    if (!redisUrl) {
      throw new Error('No Redis configuration available');
    }

    const connectionConfig: RedisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
      connectTimeout: this.config.connectTimeout || 5000,
      family: this.config.family,
      retryStrategy: (times: number) => {
        if (times > this.retryAttempts) {
          return null;
        }
        return Math.min(times * this.retryDelay, 5000);
      },
    };

    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      this.redis = new Redis(redisUrl, connectionConfig);
    } else {
      this.redis = new Redis({
        host: this.config.host || 'localhost',
        port: this.config.port || 6379,
        password: this.config.password,
        db: this.config.db || 0,
        ...connectionConfig,
      });
    }

    this.redis.on('connect', () => {
      this.connected = true;
    });

    this.redis.on('error', (err) => {
      this.connected = false;
      if (this.onConnectionError) {
        this.onConnectionError(err);
      }
    });

    this.redis.on('close', () => {
      this.connected = false;
    });

    try {
      await this.redis.connect();
      await this.redis.ping();
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  setOnConnectionError(callback: (error: Error) => void): void {
    this.onConnectionError = callback;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await this.ensureConnection();
      const stored = await redis.get(this.prefix + key);
      
      if (!stored) {
        return null;
      }

      const entry: StoredCacheEntry<T> = JSON.parse(stored);

      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const entry: StoredCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await redis.set(
        this.prefix + key,
        JSON.stringify(entry),
        'EX',
        Math.ceil(ttl / 1000)
      );
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const redis = await this.ensureConnection();
      const result = await redis.del(this.prefix + key);
      return result > 0;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const keys = await redis.keys(this.prefix + '*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis CLEAR error:', error);
      throw error;
    }
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      const redis = await this.ensureConnection();
      const fullPattern = this.prefix + pattern.replace(/^cache:/, '');
      const keys = await redis.keys(fullPattern);
      return keys.map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  }

  async healthCheck(): Promise<CacheStoreHealth> {
    const start = Date.now();
    try {
      const redis = await this.ensureConnection();
      await redis.ping();
      return {
        healthy: true,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async registerDependencies(
    key: string,
    dependencies: string[]
  ): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const stored = await redis.get(this.prefix + key);
      
      if (stored) {
        const entry: StoredCacheEntry<unknown> = JSON.parse(stored);
        entry.dependencies = dependencies;
        await redis.set(
          this.prefix + key,
          JSON.stringify(entry),
          'KEEPTTL'
        );
      }

      for (const depKey of dependencies) {
        const depStored = await redis.get(this.prefix + depKey);
        let depEntry: StoredCacheEntry<unknown>;
        
        if (depStored) {
          depEntry = JSON.parse(depStored);
        } else {
          depEntry = {
            data: null,
            timestamp: Date.now(),
            ttl: this.defaultTtl,
            dependents: [],
          };
        }
        
        if (!depEntry.dependents) {
          depEntry.dependents = [];
        }
        
        if (!depEntry.dependents.includes(key)) {
          depEntry.dependents.push(key);
        }
        
        if (!depStored) {
          await redis.set(
            this.prefix + depKey,
            JSON.stringify(depEntry),
            'EX',
            Math.ceil(this.defaultTtl / 1000)
          );
        } else {
          await redis.set(
            this.prefix + depKey,
            JSON.stringify(depEntry),
            'KEEPTTL'
          );
        }
      }
    } catch (error) {
      console.error('Redis registerDependencies error:', error);
    }
  }

  async getDependencies(key: string): Promise<{ dependencies: string[]; dependents: string[] }> {
    try {
      const redis = await this.ensureConnection();
      const stored = await redis.get(this.prefix + key);
      
      if (!stored) {
        return { dependencies: [], dependents: [] };
      }

      const entry: StoredCacheEntry<unknown> = JSON.parse(stored);
      return {
        dependencies: entry.dependencies || [],
        dependents: entry.dependents || [],
      };
    } catch (error) {
      console.error('Redis getDependencies error:', error);
      return { dependencies: [], dependents: [] };
    }
  }

  async invalidateWithDependents(key: string): Promise<number> {
    let invalidated = 0;
    const toInvalidate: string[] = [key];
    
    try {
      const redis = await this.ensureConnection();
      
      while (toInvalidate.length > 0) {
        const currentKey = toInvalidate.pop()!;
        const stored = await redis.get(this.prefix + currentKey);
        
        if (stored) {
          const entry: StoredCacheEntry<unknown> = JSON.parse(stored);
          
          if (entry.dependents && entry.dependents.length > 0) {
            for (const dep of entry.dependents) {
              if (!toInvalidate.includes(dep)) {
                toInvalidate.push(dep);
              }
            }
          }
          
          await redis.del(this.prefix + currentKey);
          invalidated++;
        }
      }
    } catch (error) {
      console.error('Redis invalidateWithDependents error:', error);
    }
    
    return invalidated;
  }
}

export function createRedisStore(
  config?: RedisConfig,
  options?: CacheStoreOptions
): RedisCacheStore {
  return new RedisCacheStore(config, options);
}