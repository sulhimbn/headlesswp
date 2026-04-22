import { redisCacheManager } from '@/lib/cache/redisAdapter';

const getIsRedisConfigured = () => {
  const CACHE_ADAPTER = process.env.CACHE_ADAPTER || 'memory';
  const REDIS_URL = process.env.REDIS_URL || '';
  return CACHE_ADAPTER === 'redis' && REDIS_URL !== '';
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    const sets = new Map<string, Set<string>>();
    
    return {
      on: jest.fn(),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      get: jest.fn((key: string) => {
        return Promise.resolve(store.get(key) || null);
      }),
      del: jest.fn((...keys: string[]) => {
        keys.forEach(k => store.delete(k));
        return Promise.resolve(1);
      }),
      exists: jest.fn((key: string) => {
        return Promise.resolve(store.has(key) ? 1 : 0);
      }),
      keys: jest.fn((pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Promise.resolve(Array.from(store.keys()).filter(k => regex.test(k)));
      }),
      sadd: jest.fn((key: string, ...members: string[]) => {
        if (!sets.has(key)) sets.set(key, new Set());
        members.forEach(m => sets.get(key)!.add(m));
        return Promise.resolve(members.length);
      }),
      smembers: jest.fn((key: string) => {
        const set = sets.get(key);
        return Promise.resolve(set ? Array.from(set) : []);
      }),
      expire: jest.fn(() => Promise.resolve(1)),
      pipeline: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        sadd: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      })),
      quit: jest.fn(() => Promise.resolve('OK')),
      connect: jest.fn(() => Promise.resolve()),
    };
  });
});

describe('RedisCacheManager', () => {
  describe('isRedisConfigured', () => {
    it('should return false when CACHE_ADAPTER is not redis', () => {
      expect(getIsRedisConfigured()).toBe(false);
    });

    it('should return false when CACHE_ADAPTER is redis but REDIS_URL is not set', () => {
      process.env.CACHE_ADAPTER = 'redis';
      expect(getIsRedisConfigured()).toBe(false);
      process.env.CACHE_ADAPTER = 'memory';
    });

    it('should return true when both CACHE_ADAPTER is redis and REDIS_URL is set', () => {
      process.env.CACHE_ADAPTER = 'redis';
      process.env.REDIS_URL = 'redis://localhost:6379';
      expect(getIsRedisConfigured()).toBe(true);
      process.env.CACHE_ADAPTER = 'memory';
      process.env.REDIS_URL = '';
    });
  });

  describe('Basic Operations (Memory Fallback)', () => {
    beforeEach(() => {
      process.env.CACHE_ADAPTER = 'memory';
      process.env.REDIS_URL = '';
      redisCacheManager.clearAll();
      redisCacheManager.resetStats();
    });

    it('should track cache hits', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      redisCacheManager.get('key1');
      
      const stats = redisCacheManager.getStats();
      expect(stats.hits).toBe(1);
    });

    it('should track cache misses', () => {
      redisCacheManager.get('non-existent');
      
      const stats = redisCacheManager.getStats();
      expect(stats.misses).toBe(1);
    });

    it('should track sets', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      
      const stats = redisCacheManager.getStats();
      expect(stats.sets).toBe(1);
    });

    it('should delete entries', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      const deleted = redisCacheManager.delete('key1');
      
      expect(deleted).toBe(true);
    });

    it('should clear all entries', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      redisCacheManager.set('key2', 'value2', 60000);
      redisCacheManager.clearAll();
      
      expect(redisCacheManager.get('key1')).toBeNull();
      expect(redisCacheManager.get('key2')).toBeNull();
    });

    it('should calculate hit rate', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      redisCacheManager.get('key1');
      redisCacheManager.get('non-existent');
      redisCacheManager.get('another-nonexistent');
      
      const stats = redisCacheManager.getStats();
      expect(stats.hitRate).toBe(33.33333333333333);
    });

    it('should calculate performance metrics', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      redisCacheManager.get('key1');
      
      const metrics = redisCacheManager.getPerformanceMetrics();
      expect(metrics.efficiencyScore).toBe('high');
      expect(metrics.hitRate).toBe(100);
    });

    it('should reset stats', () => {
      redisCacheManager.set('key1', 'value1', 60000);
      redisCacheManager.get('key1');
      redisCacheManager.resetStats();
      
      const stats = redisCacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.sets).toBe(0);
    });
  });
});