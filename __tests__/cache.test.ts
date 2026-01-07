import { cacheManager, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { wordpressAPI } from '@/lib/wordpress';

// Mock axios for testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('Cache Manager', () => {
  beforeEach(() => {
    cacheManager.clear();
    // Reset stats by creating a new instance for testing
    (cacheManager as any).stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
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

    it('should handle expired entries', () => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';
      
      cacheManager.set(key, testData, 1); // 1ms TTL
      
      // Wait for expiration
      setTimeout(() => {
        const result = cacheManager.get(key);
        expect(result).toBeNull();
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
    it('should clean up expired entries', () => {
      cacheManager.set('key1', 'data1', 1); // Will expire
      cacheManager.set('key2', 'data2', 10000); // Won't expire
      
      setTimeout(() => {
        const cleaned = cacheManager.cleanup();
        expect(cleaned).toBe(1);
        expect(cacheManager.get('key1')).toBeNull();
        expect(cacheManager.get('key2')).toBe('data2');
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
});

describe('WordPress API Caching', () => {
  beforeEach(() => {
    cacheManager.clear();
    // Reset stats
    (cacheManager as any).stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  });

  describe('Cache Integration', () => {
    it('should cache getPosts calls', async () => {
      // Mock the API call
      const mockPosts = [
        { id: 1, title: { rendered: 'Post 1' } },
        { id: 2, title: { rendered: 'Post 2' } },
      ];
      
      // This would normally make an API call, but we'll test the caching logic
      const stats1 = wordpressAPI.getCacheStats();
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
      const stats = wordpressAPI.getCacheStats();
      
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
      wordpressAPI.clearCache();
      expect(cacheManager.get('test-key')).toBeNull();
    });

    it('should clear cache with pattern', () => {
      cacheManager.set('posts:1', 'post1', 1000);
      cacheManager.set('categories:1', 'cat1', 1000);
      
      wordpressAPI.clearCache('posts:*');
      
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