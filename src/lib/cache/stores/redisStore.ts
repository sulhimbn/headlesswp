import Redis from 'ioredis';
import type { ICacheStore, CacheStoreOptions } from '../types';

export class RedisCacheStore implements ICacheStore {
  private client: Redis | null = null;
  private options: Required<CacheStoreOptions>;
  private connected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(options: CacheStoreOptions = {}) {
    this.options = {
      redisUrl: options.redisUrl ?? process.env.REDIS_URL ?? '',
      keyPrefix: options.keyPrefix ?? 'headlesswp:cache:',
      defaultTtl: options.defaultTtl ?? 300000,
    };
  }

  private getKey(key: string): string {
    return `${this.options.keyPrefix}${key}`;
  }

  private async ensureConnection(): Promise<void> {
    if (this.client && this.connected) {
      return;
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    this.connectionPromise = this.initConnection();
    await this.connectionPromise;
    this.connectionPromise = null;
  }

  private async initConnection(): Promise<void> {
    if (!this.options.redisUrl) {
      throw new Error('REDIS_URL is not configured');
    }

    this.client = new Redis(this.options.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err.message);
      this.connected = false;
    });

    this.client.on('connect', () => {
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      this.connected = false;
    });

    try {
      await this.client.connect();
      await this.client.ping();
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return null;
      }

      const fullKey = this.getKey(key);
      const value = await this.client.get(fullKey);

      if (!value) {
        return null;
      }

      const entry = JSON.parse(value) as { data: T; timestamp: number; ttl: number };

      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return;
      }

      const fullKey = this.getKey(key);
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await this.client.set(fullKey, JSON.stringify(entry), 'EX', Math.ceil(ttl / 1000));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return false;
      }

      const fullKey = this.getKey(key);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return;
      }

      const keys = await this.client.keys(`${this.options.keyPrefix}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return [];
      }

      const searchPattern = pattern
        ? `${this.options.keyPrefix}${pattern.replace('*', '*')}`
        : `${this.options.keyPrefix}*`;

      const keys = await this.client.keys(searchPattern);
      return keys.map(key => key.replace(this.options.keyPrefix, ''));
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.connected) {
        await this.ensureConnection();
      }

      if (!this.client) {
        return false;
      }

      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check error:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
