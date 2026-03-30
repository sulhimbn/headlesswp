import { RedisCacheAdapter, type RedisCacheConfig, type RedisCacheOptions } from './redisAdapter';
import { REDIS_CONFIG } from '@/lib/api/config';

export type CacheAdapterType = 'redis' | 'memory';

export interface CacheFactoryOptions {
  adapterType?: CacheAdapterType;
  redisConfig?: RedisCacheConfig;
  defaultTtl?: number;
}

export class CacheFactory {
  static createRedisAdapter(options?: {
    config?: RedisCacheConfig;
    defaultTtl?: number;
    enableFallback?: boolean;
  }): RedisCacheAdapter {
    const config = options?.config || {};
    const redisOptions: RedisCacheOptions = {
      config: {
        url: config.url || REDIS_CONFIG.URL,
        host: config.host || REDIS_CONFIG.HOST,
        port: config.port || REDIS_CONFIG.PORT,
        password: config.password || REDIS_CONFIG.PASSWORD,
        db: config.db || REDIS_CONFIG.DB,
        keyPrefix: config.keyPrefix || REDIS_CONFIG.KEY_PREFIX,
        connectTimeout: config.connectTimeout || REDIS_CONFIG.CONNECT_TIMEOUT,
        enableReadyCheck: config.enableReadyCheck ?? REDIS_CONFIG.ENABLE_READY_CHECK,
        lazyConnect: config.lazyConnect ?? REDIS_CONFIG.LAZY_CONNECT,
      },
      defaultTtl: options?.defaultTtl || 60000,
      enableFallback: options?.enableFallback ?? REDIS_CONFIG.ENABLE_FALLBACK,
    };

    return new RedisCacheAdapter(redisOptions);
  }

  static async createCacheAdapter(options?: CacheFactoryOptions): Promise<RedisCacheAdapter> {
    const adapterType = options?.adapterType || 'memory';
    
    if (adapterType === 'redis' || REDIS_CONFIG.URL || REDIS_CONFIG.HOST) {
      const adapter = this.createRedisAdapter({
        config: options?.redisConfig,
        defaultTtl: options?.defaultTtl,
      });

      try {
        await adapter.connect();
        return adapter;
      } catch (error) {
        if (!REDIS_CONFIG.ENABLE_FALLBACK) {
          throw error;
        }
        return adapter;
      }
    }

    return this.createRedisAdapter({
      config: {
        host: 'localhost',
        port: 6379,
      },
      defaultTtl: options?.defaultTtl || 60000,
      enableFallback: true,
    });
  }
}

export const cacheFactory = {
  createRedisAdapter: CacheFactory.createRedisAdapter,
  createCacheAdapter: CacheFactory.createCacheAdapter,
};
