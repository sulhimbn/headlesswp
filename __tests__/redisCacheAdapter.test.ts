import { RedisCacheAdapter } from '@/lib/cache/redisCacheAdapter';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      expire: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      sismember: jest.fn().mockResolvedValue(0),
      quit: jest.fn().mockResolvedValue('OK'),
      status: 'ready',
    };
  });
});

describe('RedisCacheAdapter', () => {
  let cacheAdapter: RedisCacheAdapter;

  beforeEach(() => {
    cacheAdapter = new RedisCacheAdapter({
      enabled: false,
      fallbackToMemory: true,
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const adapter = new RedisCacheAdapter();
      expect(adapter).toBeDefined();
    });

    it('should create instance with custom config', () => {
      const adapter = new RedisCacheAdapter({
        enabled: true,
        keyPrefix: 'test:',
      });
      expect(adapter).toBeDefined();
    });

    it('should use in-memory cache when disabled', () => {
      const adapter = new RedisCacheAdapter({
        enabled: false,
      });
      expect(adapter).toBeDefined();
    });
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key = 'test:key';
      const data = { foo: 'bar' };
      const ttl = 60000;

      cacheAdapter.set(key, data, ttl);
      const result = cacheAdapter.get<typeof data>(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = cacheAdapter.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should track hits and misses', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.get('key1');
      cacheAdapter.get('nonexistent');

      const stats = cacheAdapter.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', () => {
      const key = 'expiring:key';
      const data = 'expiring data';
      
      cacheAdapter.set(key, data, 1);
      expect(cacheAdapter.get(key)).toBe(data);

      jest.useFakeTimers();
      jest.advanceTimersByTime(2);

      expect(cacheAdapter.get(key)).toBeNull();
      jest.useRealTimers();
    });

    it('should clean up expired entries', () => {
      cacheAdapter.set('key1', 'data1', 1);
      cacheAdapter.set('key2', 'data2', 60000);

      jest.useFakeTimers();
      jest.advanceTimersByTime(2);

      const cleaned = cacheAdapter.cleanup();
      expect(cleaned).toBe(1);
      jest.useRealTimers();
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      const deleted = cacheAdapter.delete('key1');

      expect(deleted).toBe(true);
      expect(cacheAdapter.get('key1')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const deleted = cacheAdapter.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('invalidate with dependencies', () => {
    it('should invalidate dependent keys', () => {
      cacheAdapter.set('post:1', { title: 'Post 1' }, 60000, ['category:1']);
      cacheAdapter.set('post:2', { title: 'Post 2' }, 60000, ['category:1']);
      cacheAdapter.set('category:1', { name: 'Category 1' }, 60000);

      cacheAdapter.invalidate('category:1');

      expect(cacheAdapter.get('category:1')).toBeNull();
      expect(cacheAdapter.get('post:1')).toBeNull();
      expect(cacheAdapter.get('post:2')).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all entries', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.set('key2', 'value2', 60000);

      cacheAdapter.clearAll();

      expect(cacheAdapter.get('key1')).toBeNull();
      expect(cacheAdapter.get('key2')).toBeNull();
    });
  });

  describe('clearPattern', () => {
    it('should clear entries matching pattern', () => {
      cacheAdapter.set('post:1', 'data1', 60000);
      cacheAdapter.set('post:2', 'data2', 60000);
      cacheAdapter.set('category:1', 'data3', 60000);

      cacheAdapter.clearPattern('^post:');

      expect(cacheAdapter.get('post:1')).toBeNull();
      expect(cacheAdapter.get('post:2')).toBeNull();
      expect(cacheAdapter.get('category:1')).toBe('data3');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.get('key1');
      cacheAdapter.get('nonexistent');
      cacheAdapter.delete('key1');

      const stats = cacheAdapter.getStats();

      expect(stats.sets).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.deletes).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.get('key1');
      cacheAdapter.get('key1');
      cacheAdapter.get('nonexistent');

      const stats = cacheAdapter.getStats();

      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.get('key1');

      const metrics = cacheAdapter.getPerformanceMetrics();

      expect(metrics).toHaveProperty('efficiencyScore');
      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('size');
      expect(metrics).toHaveProperty('memoryUsageMB');
    });
  });

  describe('invalidateByEntityType', () => {
    it('should invalidate entries by entity type', () => {
      cacheAdapter.set('post:1', 'data1', 60000);
      cacheAdapter.set('post:2', 'data2', 60000);
      cacheAdapter.set('category:1', 'data3', 60000);

      const invalidated = cacheAdapter.invalidateByEntityType('post');

      expect(invalidated).toBe(2);
      expect(cacheAdapter.get('post:1')).toBeNull();
      expect(cacheAdapter.get('post:2')).toBeNull();
      expect(cacheAdapter.get('category:1')).toBe('data3');
    });
  });

  describe('getKeysByPattern', () => {
    it('should return keys matching pattern', () => {
      cacheAdapter.set('post:1', 'data1', 60000);
      cacheAdapter.set('post:2', 'data2', 60000);
      cacheAdapter.set('category:1', 'data3', 60000);

      const keys = cacheAdapter.getKeysByPattern('^post:');

      expect(keys).toHaveLength(2);
      expect(keys).toContain('post:1');
      expect(keys).toContain('post:2');
    });
  });

  describe('getDependencies', () => {
    it('should return dependencies and dependents', () => {
      cacheAdapter.set('post:1', 'data1', 60000, ['category:1']);

      const { dependencies, dependents } = cacheAdapter.getDependencies('post:1');

      expect(dependencies).toContain('category:1');
      expect(dependents).toEqual([]);
    });
  });

  describe('resetStats', () => {
    it('should reset statistics', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.get('key1');

      cacheAdapter.resetStats();

      const stats = cacheAdapter.getStats();
      expect(stats.sets).toBe(0);
      expect(stats.hits).toBe(0);
    });
  });

  describe('getMemoryUsage', () => {
    it('should estimate memory usage', () => {
      cacheAdapter.set('key1', { data: 'some data' }, 60000);

      const usage = cacheAdapter.getMemoryUsage();

      expect(usage).toBeGreaterThan(0);
    });
  });

  describe('cleanupOrphanDependencies', () => {
    it('should clean up orphaned dependencies', () => {
      cacheAdapter.set('post:1', 'data1', 60000, ['category:999']);

      const cleaned = cacheAdapter.cleanupOrphanDependencies();

      expect(cleaned).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all when no pattern provided', () => {
      cacheAdapter.set('key1', 'value1', 60000);
      cacheAdapter.set('key2', 'value2', 60000);

      cacheAdapter.clear();

      expect(cacheAdapter.get('key1')).toBeNull();
      expect(cacheAdapter.get('key2')).toBeNull();
    });

    it('should clear pattern when provided', () => {
      cacheAdapter.set('post:1', 'data1', 60000);
      cacheAdapter.set('category:1', 'data2', 60000);

      cacheAdapter.clear('^post:');

      expect(cacheAdapter.get('post:1')).toBeNull();
      expect(cacheAdapter.get('category:1')).toBe('data2');
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect gracefully', async () => {
      const adapter = new RedisCacheAdapter({
        enabled: true,
      });

      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });
  });
});
