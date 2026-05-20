import { RedisCacheAdapter } from '@/lib/cache/redisAdapter';
import { RedisConfig } from '@/lib/cache/redisConfig';

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;

  const testConfig: RedisConfig = {
    url: 'redis://localhost:6379',
    enabled: false,
    retryStrategy: {
      maxRetries: 1,
      retryInterval: 100,
    },
    keyPrefix: 'test:',
  };

  beforeEach(() => {
    adapter = new RedisCacheAdapter(testConfig);
  });

  afterEach(async () => {
    adapter.clearAll();
    adapter.resetStats();
    await adapter.disconnect();
  });

  describe('Fallback Mode (Redis Disabled)', () => {
    it('should use fallback cache when Redis is disabled', () => {
      expect(adapter.isUsingFallback()).toBe(true);
    });

    it('should store and retrieve data from fallback cache', () => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      adapter.set(key, testData, 1000);
      const retrieved = adapter.get(key);
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = adapter.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle expired entries', (done) => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      adapter.set(key, testData, 1);
      
      setTimeout(() => {
        const result = adapter.get(key);
        expect(result).toBeNull();
        done();
      }, 10);
    });

    it('should delete specific entries', () => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      adapter.set(key, testData, 1000);
      expect(adapter.get(key)).toEqual(testData);
      
      const deleted = adapter.delete(key);
      expect(deleted).toBe(true);
      expect(adapter.get(key)).toBeNull();
    });

    it('should clear all cache', () => {
      adapter.set('key1', 'data1', 1000);
      adapter.set('key2', 'data2', 1000);
      
      expect(adapter.get('key1')).toBe('data1');
      expect(adapter.get('key2')).toBe('data2');
      
      adapter.clearAll();
      
      expect(adapter.get('key1')).toBeNull();
      expect(adapter.get('key2')).toBeNull();
    });
  });

  describe('Pattern-based Clearing', () => {
    it('should clear entries matching pattern', () => {
      adapter.set('posts:1', 'post1', 1000);
      adapter.set('posts:2', 'post2', 1000);
      adapter.set('categories:1', 'cat1', 1000);
      
      adapter.clearPattern('posts:*');
      
      expect(adapter.get('posts:1')).toBeNull();
      expect(adapter.get('posts:2')).toBeNull();
      expect(adapter.get('categories:1')).toBe('cat1');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics correctly', () => {
      const testData = { id: 1, title: 'Test Post' };
      
      let stats = adapter.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      
      adapter.set('test-key', testData, 1000);
      stats = adapter.getStats();
      expect(stats.sets).toBe(1);
      
      adapter.get('test-key');
      stats = adapter.getStats();
      expect(stats.hits).toBe(1);
      
      adapter.get('non-existent');
      stats = adapter.getStats();
      expect(stats.misses).toBe(1);
      
      expect(stats.hitRate).toBe(50);
    });
  });

  describe('Cache Cleanup', () => {
    it('should clean up expired entries', (done) => {
      adapter.set('key1', 'data1', 1);
      adapter.set('key2', 'data2', 10000);
      
      setTimeout(() => {
        const cleaned = adapter.cleanup();
        expect(cleaned).toBe(1);
        expect(adapter.get('key1')).toBeNull();
        expect(adapter.get('key2')).toBe('data2');
        done();
      }, 10);
    });

    it('should return 0 when no expired entries', () => {
      adapter.set('key1', 'data1', 10000);
      adapter.set('key2', 'data2', 10000);
      
      const cleaned = adapter.cleanup();
      
      expect(cleaned).toBe(0);
      expect(adapter.get('key1')).toBe('data1');
      expect(adapter.get('key2')).toBe('data2');
    });
  });

  describe('Memory Usage', () => {
    it('should estimate memory usage', () => {
      adapter.set('key1', 'data1', 1000);
      adapter.set('key2', { complex: 'data' }, 1000);
      
      const usage = adapter.getMemoryUsage();
      expect(usage).toBeGreaterThan(0);
      expect(typeof usage).toBe('number');
    });
  });

  describe('Dependency Tracking', () => {
    it('should set cache entry with dependencies', () => {
      const dependencies = ['dep1', 'dep2'];
      adapter.set('key1', 'data1', 1000, dependencies);

      const retrieved = adapter.get('key1');
      expect(retrieved).toBe('data1');

      const deps = adapter.getDependencies('key1');
      expect(deps.dependencies).toEqual(dependencies);
    });

    it('should cascade invalidate dependents', () => {
      adapter.set('dep1', 'dep-data', 1000);
      adapter.set('key1', 'data1', 1000, ['dep1']);
      adapter.set('key2', 'data2', 1000, ['dep1']);

      expect(adapter.get('key1')).toBe('data1');
      expect(adapter.get('key2')).toBe('data2');

      adapter.invalidate('dep1');

      expect(adapter.get('dep1')).toBeNull();
      expect(adapter.get('key1')).toBeNull();
      expect(adapter.get('key2')).toBeNull();
    });

    it('should recursively cascade invalidate nested dependents', () => {
      adapter.set('dep1', 'dep-data', 1000);
      adapter.set('key1', 'data1', 1000, ['dep1']);
      adapter.set('key2', 'data2', 1000, ['key1']);

      adapter.invalidate('dep1');

      expect(adapter.get('dep1')).toBeNull();
      expect(adapter.get('key1')).toBeNull();
      expect(adapter.get('key2')).toBeNull();
    });

    it('should track cascade invalidations in stats', () => {
      adapter.set('dep1', 'dep-data', 1000);
      adapter.set('key1', 'data1', 1000, ['dep1']);
      adapter.set('key2', 'data2', 1000, ['dep1']);

      adapter.invalidate('dep1');

      const stats = adapter.getStats();
      expect(stats.cascadeInvalidations).toBeGreaterThan(0);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate by entity type', () => {
      adapter.set('post:1', 'post1', 1000);
      adapter.set('post:2', 'post2', 1000);
      adapter.set('categories', 'cats', 1000);
      adapter.set('category:1', 'cat1', 1000);

      const invalidated = adapter.invalidateByEntityType('post');

      expect(invalidated).toBe(2);
      expect(adapter.get('post:1')).toBeNull();
      expect(adapter.get('post:2')).toBeNull();
      expect(adapter.get('categories')).toBe('cats');
      expect(adapter.get('category:1')).toBe('cat1');
    });

    it('should get keys matching pattern', () => {
      adapter.set('post:1', 'post1', 1000);
      adapter.set('post:2', 'post2', 1000);
      adapter.set('categories', 'cats', 1000);

      const keys = adapter.getKeysByPattern('post:*');

      expect(keys).toContain('post:1');
      expect(keys).toContain('post:2');
      expect(keys).not.toContain('categories');
    });
  });

  describe('Orphan Dependency Cleanup', () => {
    it('should clean up orphan dependencies', () => {
      adapter.set('dep1', 'dep-data', 1000);
      adapter.set('key1', 'data1', 1000, ['dep1', 'dep2']);

      const cleaned = adapter.cleanupOrphanDependencies();

      expect(cleaned).toBe(1);

      const deps = adapter.getDependencies('key1');
      expect(deps.dependencies).toEqual(['dep1']);
    });

    it('should return 0 when no orphan dependencies', () => {
      adapter.set('dep1', 'dep-data', 1000);
      adapter.set('key1', 'data1', 1000, ['dep1']);

      const cleaned = adapter.cleanupOrphanDependencies();

      expect(cleaned).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', () => {
      adapter.set('key1', 'data1', 1000);

      for (let i = 0; i < 8; i++) {
        adapter.get('key1');
      }
      adapter.get('non-existent');

      const metrics = adapter.getPerformanceMetrics();

      expect(metrics).toHaveProperty('efficiencyScore');
      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('size');
      expect(metrics).toHaveProperty('memoryUsageMB');
      expect(metrics).toHaveProperty('cascadeInvalidations');
      expect(metrics).toHaveProperty('dependencyRegistrations');
      expect(metrics).toHaveProperty('avgTtlSeconds');

      expect(metrics.efficiencyScore).toBe('high');
      expect(metrics.hitRate).toBe(88.89);
    });
  });
});

describe('RedisCacheAdapter Configuration', () => {
  it('should create adapter with custom config', () => {
    const config: RedisConfig = {
      url: 'redis://custom:6379',
      enabled: false,
      keyPrefix: 'custom:prefix:',
    };

    const adapter = new RedisCacheAdapter(config);
    expect(adapter.isUsingFallback()).toBe(true);
  });
});
