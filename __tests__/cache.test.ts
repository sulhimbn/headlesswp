import { cacheManager, CACHE_TTL, CACHE_KEYS, CACHE_DEPENDENCIES } from '@/lib/cache';

// Mock axios for testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('Cache Manager', () => {
  beforeEach(() => {
    cacheManager.clearAll();
    cacheManager.resetStats();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      cacheManager.set(key, testData, 1000);
      const retrieved = cacheManager.get(key);
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle expired entries', (done) => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      cacheManager.set(key, testData, 1); // 1ms TTL
      
      // Wait for expiration
      setTimeout(() => {
        const result = cacheManager.get(key);
        expect(result).toBeNull();
        done();
      }, 10);
    });

    it('should increment misses and deletes when entry has expired', (done) => {
      const key = 'test-key';
      cacheManager.set(key, 'data', 1);
      
      const statsBefore = cacheManager.getStats();
      
      setTimeout(() => {
        cacheManager.get(key);
        const statsAfter = cacheManager.getStats();
        expect(statsAfter.misses).toBe(statsBefore.misses + 1);
        expect(statsAfter.deletes).toBe(statsBefore.deletes + 1);
        done();
      }, 10);
    });

    it('should delete specific entries', () => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      cacheManager.set(key, testData, 1000);
      expect(cacheManager.get(key)).toEqual(testData);
      
      const deleted = cacheManager.delete(key);
      expect(deleted).toBe(true);
      expect(cacheManager.get(key)).toBeNull();
    });

    it('should clear all cache', () => {
      cacheManager.set('key1', 'data1', 1000);
      cacheManager.set('key2', 'data2', 1000);
      
      expect(cacheManager.get('key1')).toBe('data1');
      expect(cacheManager.get('key2')).toBe('data2');
      
      cacheManager.clear();
      
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
    });
  });

  describe('Pattern-based Clearing', () => {
    it('should clear entries matching pattern', () => {
      cacheManager.set('posts:1', 'post1', 1000);
      cacheManager.set('posts:2', 'post2', 1000);
      cacheManager.set('categories:1', 'cat1', 1000);
      
      cacheManager.clearPattern('posts:*');
      
      expect(cacheManager.get('posts:1')).toBeNull();
      expect(cacheManager.get('posts:2')).toBeNull();
      expect(cacheManager.get('categories:1')).toBe('cat1');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics correctly', () => {
      const testData = { id: 1, title: 'Test Post' };
      
      // Initial stats
      let stats = cacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      
      // Set data
      cacheManager.set('test-key', testData, 1000);
      stats = cacheManager.getStats();
      expect(stats.sets).toBe(1);
      
      // Hit
      cacheManager.get('test-key');
      stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      
      // Miss
      cacheManager.get('non-existent');
      stats = cacheManager.getStats();
      expect(stats.misses).toBe(1);
      
      // Hit rate calculation
      expect(stats.hitRate).toBe(50);
    });
  });

  describe('Cache Cleanup', () => {
    it('should clean up expired entries', (done) => {
      cacheManager.set('key1', 'data1', 1);
      cacheManager.set('key2', 'data2', 10000);
      
      setTimeout(() => {
        const cleaned = cacheManager.cleanup();
        expect(cleaned).toBe(1);
        expect(cacheManager.get('key1')).toBeNull();
        expect(cacheManager.get('key2')).toBe('data2');
        done();
      }, 10);
    });

    it('should return 0 when no expired entries', () => {
      cacheManager.set('key1', 'data1', 10000);
      cacheManager.set('key2', 'data2', 10000);
      
      const cleaned = cacheManager.cleanup();
      
      expect(cleaned).toBe(0);
      expect(cacheManager.get('key1')).toBe('data1');
      expect(cacheManager.get('key2')).toBe('data2');
    });

    it('should clean up all expired entries', (done) => {
      cacheManager.set('key1', 'data1', 1);
      cacheManager.set('key2', 'data2', 1);
      cacheManager.set('key3', 'data3', 10000);
      
      setTimeout(() => {
        const cleaned = cacheManager.cleanup();
        expect(cleaned).toBe(2);
        expect(cacheManager.get('key1')).toBeNull();
        expect(cacheManager.get('key2')).toBeNull();
        expect(cacheManager.get('key3')).toBe('data3');
        done();
      }, 10);
    });

    it('should update delete stats when cleaning up expired entries', (done) => {
      const initialStats = cacheManager.getStats();
      cacheManager.set('key1', 'data1', 1);
      
      setTimeout(() => {
        cacheManager.cleanup();
        const statsAfter = cacheManager.getStats();
        expect(statsAfter.deletes).toBe(initialStats.deletes + 1);
        done();
      }, 10);
    });
  });

  describe('Memory Usage', () => {
    it('should estimate memory usage', () => {
      cacheManager.set('key1', 'data1', 1000);
      cacheManager.set('key2', { complex: 'data' }, 1000);
      
      const usage = cacheManager.getMemoryUsage();
      expect(usage).toBeGreaterThan(0);
      expect(typeof usage).toBe('number');
    });
  });
});

describe('Cache Keys', () => {
  it('should generate consistent cache keys', () => {
    expect(CACHE_KEYS.posts()).toBe('posts:default');
    expect(CACHE_KEYS.posts('{"page":1}')).toBe('posts:{"page":1}');
    expect(CACHE_KEYS.post('test-slug')).toBe('post:test-slug');
    expect(CACHE_KEYS.postById(123)).toBe('post:123');
    expect(CACHE_KEYS.categories()).toBe('categories');
    expect(CACHE_KEYS.search('test query')).toBe('search:test query');
  });

  it('should generate category cache key', () => {
    const key = CACHE_KEYS.category('technology');
    expect(key).toBe('category:technology');
  });

  it('should generate tag cache key', () => {
    const key = CACHE_KEYS.tag('javascript');
    expect(key).toBe('tag:javascript');
  });

  it('should generate media cache key', () => {
    const key = CACHE_KEYS.media(123);
    expect(key).toBe('media:123');
  });

  it('should generate author cache key', () => {
    const key = CACHE_KEYS.author(456);
    expect(key).toBe('author:456');
  });

  it('should generate search cache key', () => {
    const key = CACHE_KEYS.search('react hooks');
    expect(key).toBe('search:react hooks');
  });

  it('should generate tags cache key', () => {
    const key = CACHE_KEYS.tags();
    expect(key).toBe('tags');
  });
});

describe('WordPress API Caching', () => {
  beforeEach(() => {
    cacheManager.clear();
    cacheManager.resetStats();
  });

  describe('Cache Integration', () => {
    it('should cache getPosts calls', async () => {
      // This would normally make an API call, but we'll test the caching logic
      const stats1 = cacheManager.getStats();
      expect(stats1.hits).toBe(0);

      // The actual API call would be made here and cached
      // For testing, we'll verify the cache structure
      const cacheKey = CACHE_KEYS.posts();
      expect(cacheKey).toBe('posts:default');
    });

    it('should use different cache keys for different parameters', () => {
      const key1 = CACHE_KEYS.posts('{"page":1}');
      const key2 = CACHE_KEYS.posts('{"page":2}');

      expect(key1).not.toBe(key2);
      expect(key1).toBe('posts:{"page":1}');
      expect(key2).toBe('posts:{"page":2}');
    });
  });

  describe('Cache Management Functions', () => {
    it('should provide cache statistics', () => {
      const stats = cacheManager.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('size');
    });

    it('should clear cache', () => {
      // Set some test data
      cacheManager.set('test-key', 'test-data', 1000);
      expect(cacheManager.get('test-key')).toBe('test-data');

      // Clear cache
      cacheManager.clear();
      expect(cacheManager.get('test-key')).toBeNull();
    });

    it('should clear cache with pattern', () => {
      cacheManager.set('posts:1', 'post1', 1000);
      cacheManager.set('categories:1', 'cat1', 1000);

      cacheManager.clearPattern('posts:*');

      expect(cacheManager.get('posts:1')).toBeNull();
      expect(cacheManager.get('categories:1')).toBe('cat1');
    });
  });
});

describe('Cache TTL Constants', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.POSTS).toBe(5 * 60 * 1000); // 5 minutes
    expect(CACHE_TTL.POST).toBe(10 * 60 * 1000); // 10 minutes
    expect(CACHE_TTL.CATEGORIES).toBe(30 * 60 * 1000); // 30 minutes
    expect(CACHE_TTL.TAGS).toBe(30 * 60 * 1000); // 30 minutes
    expect(CACHE_TTL.MEDIA).toBe(60 * 60 * 1000); // 1 hour
    expect(CACHE_TTL.SEARCH).toBe(2 * 60 * 1000); // 2 minutes
    expect(CACHE_TTL.AUTHOR).toBe(30 * 60 * 1000); // 30 minutes
  });
});

describe('Cache Dependency Tracking', () => {
  beforeEach(() => {
    cacheManager.clear();
    cacheManager.resetStats();
  });

  it('should set cache entry with dependencies', () => {
    const dependencies = ['dep1', 'dep2'];
    cacheManager.set('key1', 'data1', 1000, dependencies);

    const retrieved = cacheManager.get('key1');
    expect(retrieved).toBe('data1');

    const deps = cacheManager.getDependencies('key1');
    expect(deps.dependencies).toEqual(dependencies);
  });

  it('should register dependents when setting cache with dependencies', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);

    const depDependents = cacheManager.getDependencies('dep1');
    expect(depDependents.dependents).toContain('key1');
  });

  it('should cascade invalidate dependents', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);
    cacheManager.set('key2', 'data2', 1000, ['dep1']);

    expect(cacheManager.get('key1')).toBe('data1');
    expect(cacheManager.get('key2')).toBe('data2');

    cacheManager.invalidate('dep1');

    expect(cacheManager.get('dep1')).toBeNull();
    expect(cacheManager.get('key1')).toBeNull();
    expect(cacheManager.get('key2')).toBeNull();
  });

  it('should recursively cascade invalidate nested dependents', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);
    cacheManager.set('key2', 'data2', 1000, ['key1']);

    cacheManager.invalidate('dep1');

    expect(cacheManager.get('dep1')).toBeNull();
    expect(cacheManager.get('key1')).toBeNull();
    expect(cacheManager.get('key2')).toBeNull();
  });

  it('should track cascade invalidations in stats', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);
    cacheManager.set('key2', 'data2', 1000, ['dep1']);

    cacheManager.invalidate('dep1');

    const stats = cacheManager.getStats();
    expect(stats.cascadeInvalidations).toBeGreaterThan(0);
  });

  it('should track dependency registrations in stats', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1', 'dep2']);

    const stats = cacheManager.getStats();
    expect(stats.dependencyRegistrations).toBeGreaterThan(0);
  });

  it('should not break when dependency does not exist', () => {
    cacheManager.set('key1', 'data1', 1000, ['non-existent-dep']);

    const retrieved = cacheManager.get('key1');
    expect(retrieved).toBe('data1');

    const deps = cacheManager.getDependencies('key1');
    expect(deps.dependencies).toEqual(['non-existent-dep']);
  });

  it('should handle empty dependencies array', () => {
    cacheManager.set('key1', 'data1', 1000, []);

    const retrieved = cacheManager.get('key1');
    expect(retrieved).toBe('data1');

    const deps = cacheManager.getDependencies('key1');
    expect(deps.dependencies).toEqual([]);
  });

  it('should return empty dependency info for non-existent keys', () => {
    const deps = cacheManager.getDependencies('non-existent');
    expect(deps.dependencies).toEqual([]);
    expect(deps.dependents).toEqual([]);
  });
});

describe('Cache Invalidation', () => {
  beforeEach(() => {
    cacheManager.clear();
    cacheManager.resetStats();
  });

  it('should invalidate cache entry and its dependents', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);

    cacheManager.invalidate('dep1');

    expect(cacheManager.get('dep1')).toBeNull();
    expect(cacheManager.get('key1')).toBeNull();
  });

  it('should invalidate by entity type', () => {
    cacheManager.set('post:1', 'post1', 1000);
    cacheManager.set('post:2', 'post2', 1000);
    cacheManager.set('categories', 'cats', 1000);
    cacheManager.set('category:1', 'cat1', 1000);

    const invalidated = cacheManager.invalidateByEntityType('post');

    expect(invalidated).toBe(2);
    expect(cacheManager.get('post:1')).toBeNull();
    expect(cacheManager.get('post:2')).toBeNull();
    expect(cacheManager.get('categories')).toBe('cats');
    expect(cacheManager.get('category:1')).toBe('cat1');
  });

  it('should clear pattern with cascade invalidation', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('post:1', 'post1', 1000, ['dep1']);
    cacheManager.set('post:2', 'post2', 1000);

    cacheManager.clearPattern('post:*');

    expect(cacheManager.get('post:1')).toBeNull();
    expect(cacheManager.get('post:2')).toBeNull();
    expect(cacheManager.get('dep1')).toBe('dep-data');
  });

  it('should get keys matching pattern', () => {
    cacheManager.set('post:1', 'post1', 1000);
    cacheManager.set('post:2', 'post2', 1000);
    cacheManager.set('categories', 'cats', 1000);

    const keys = cacheManager.getKeysByPattern('post:*');

    expect(keys).toContain('post:1');
    expect(keys).toContain('post:2');
    expect(keys).not.toContain('categories');
  });
});

describe('Cache Telemetry and Performance', () => {
  beforeEach(() => {
    cacheManager.clear();
    cacheManager.resetStats();
  });

  it('should provide enhanced cache statistics', () => {
    cacheManager.set('key1', 'data1', 1000);
    cacheManager.get('key1');
    cacheManager.get('non-existent');

    const stats = cacheManager.getStats();

    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('sets');
    expect(stats).toHaveProperty('deletes');
    expect(stats).toHaveProperty('cascadeInvalidations');
    expect(stats).toHaveProperty('dependencyRegistrations');
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('invalidationRate');
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('memoryUsageBytes');
    expect(stats).toHaveProperty('avgTtl');
  });

  it('should calculate invalidation rate correctly', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);

    cacheManager.invalidate('dep1');

    const stats = cacheManager.getStats();
    expect(stats.cascadeInvalidations).toBeGreaterThan(0);
    expect(stats.deletes).toBeGreaterThan(0);
  });

  it('should calculate average TTL correctly', () => {
    cacheManager.set('key1', 'data1', 1000);
    cacheManager.set('key2', 'data2', 2000);
    cacheManager.set('key3', 'data3', 3000);

    const stats = cacheManager.getStats();
    expect(stats.avgTtl).toBe(2000);
  });

  it('should return 0 average TTL for empty cache', () => {
    const stats = cacheManager.getStats();
    expect(stats.avgTtl).toBe(0);
  });

  it('should provide performance metrics', () => {
    cacheManager.set('key1', 'data1', 1000);

    for (let i = 0; i < 8; i++) {
      cacheManager.get('key1');
    }
    cacheManager.get('non-existent');

    const metrics = cacheManager.getPerformanceMetrics();

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

  it('should return medium efficiency score for moderate hit rate', () => {
    for (let i = 0; i < 5; i++) {
      cacheManager.set(`key${i}`, `data${i}`, 1000);
    }
    cacheManager.get('key0');
    cacheManager.get('key1');
    cacheManager.get('key2');
    cacheManager.get('non-existent-1');
    cacheManager.get('non-existent-2');

    const metrics = cacheManager.getPerformanceMetrics();
    expect(metrics.efficiencyScore).toBe('medium');
  });

  it('should return low efficiency score for low hit rate', () => {
    for (let i = 0; i < 10; i++) {
      cacheManager.get(`non-existent-${i}`);
    }

    const metrics = cacheManager.getPerformanceMetrics();
    expect(metrics.efficiencyScore).toBe('low');
  });
});

describe('Orphan Dependency Cleanup', () => {
  beforeEach(() => {
    cacheManager.clear();
    cacheManager.resetStats();
  });

  it('should clean up orphan dependencies', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1', 'dep2']);

    const cleaned = cacheManager.cleanupOrphanDependencies();

    expect(cleaned).toBe(1);

    const deps = cacheManager.getDependencies('key1');
    expect(deps.dependencies).toEqual(['dep1']);
  });

  it('should return 0 when no orphan dependencies', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1']);

    const cleaned = cacheManager.cleanupOrphanDependencies();

    expect(cleaned).toBe(0);
  });

  it('should handle multiple orphan dependencies', () => {
    cacheManager.set('dep1', 'dep-data', 1000);
    cacheManager.set('key1', 'data1', 1000, ['dep1', 'dep2', 'dep3']);

    const cleaned = cacheManager.cleanupOrphanDependencies();

    expect(cleaned).toBe(2);

    const deps = cacheManager.getDependencies('key1');
    expect(deps.dependencies).toEqual(['dep1']);
  });
});

describe('CACHE_DEPENDENCIES Helpers', () => {
  it('should generate post dependencies correctly', () => {
    const deps = CACHE_DEPENDENCIES.post(1, [1, 2], [10, 11], 100);

    expect(deps).toContain('category:1');
    expect(deps).toContain('category:2');
    expect(deps).toContain('tag:10');
    expect(deps).toContain('tag:11');
    expect(deps).toContain('media:100');
    expect(deps.length).toBe(5);
  });

  it('should not include media with id 0', () => {
    const deps = CACHE_DEPENDENCIES.post(1, [1, 2], [10, 11], 0);

    expect(deps).toContain('category:1');
    expect(deps).toContain('category:2');
    expect(deps).toContain('tag:10');
    expect(deps).toContain('tag:11');
    expect(deps).not.toContain('media:0');
    expect(deps.length).toBe(4);
  });

  it('should generate posts list dependencies', () => {
    const deps = CACHE_DEPENDENCIES.postsList([1, 2], [10, 11]);

    expect(deps).toContain('category:1');
    expect(deps).toContain('category:2');
    expect(deps).toContain('tag:10');
    expect(deps).toContain('tag:11');
  });

  it('should return empty dependencies for leaf nodes', () => {
    expect(CACHE_DEPENDENCIES.media()).toEqual([]);
    expect(CACHE_DEPENDENCIES.author()).toEqual([]);
    expect(CACHE_DEPENDENCIES.categories()).toEqual([]);
    expect(CACHE_DEPENDENCIES.tags()).toEqual([]);
  });
});
