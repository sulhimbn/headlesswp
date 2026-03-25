import { RedisCacheStore } from '../src/lib/cache/stores/redisStore';
import { MemoryCacheStore } from '../src/lib/cache/stores/memoryStore';
import type { CacheEntry } from '../src/lib/cache/types';

describe('RedisCacheStore', () => {
  let store: RedisCacheStore;

  beforeEach(() => {
    store = new RedisCacheStore({ prefix: 'test:' });
  });

  describe('fallback mode', () => {
    it('should be in fallback mode when no Redis URL provided', () => {
      const fallbackStore = new RedisCacheStore();
      expect(fallbackStore.isReady()).toBe(false);
    });

    it('should return null for get when in fallback mode', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('test-key', entry);
      expect(store.get('test-key')).toBeNull();
    });

    it('should return false for delete when in fallback mode', () => {
      expect(store.delete('test-key')).toBe(false);
    });

    it('should return 0 for clearPattern when in fallback mode', () => {
      expect(store.clearPattern('test')).toBe(0);
    });

    it('should return empty array for getKeysByPattern when in fallback mode', () => {
      expect(store.getKeysByPattern('test')).toEqual([]);
    });

    it('should return 0 for size when in fallback mode', () => {
      expect(store.size()).toBe(0);
    });

    it('should return empty Map for getAll when in fallback mode', () => {
      expect(store.getAll()).toEqual(new Map());
    });

    it('clearAll should not throw when in fallback mode', () => {
      expect(() => store.clearAll()).not.toThrow();
    });
  });
});

describe('MemoryCacheStore', () => {
  let store: MemoryCacheStore;

  beforeEach(() => {
    store = new MemoryCacheStore();
  });

  describe('basic operations', () => {
    it('should return null for non-existent key', () => {
      expect(store.get('nonexistent')).toBeNull();
    });

    it('should return true for isReady', () => {
      expect(store.isReady()).toBe(true);
    });

    it('should store and retrieve data', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('test-key', entry);
      const result = store.get('test-key');
      expect(result?.data).toEqual({ test: 'value' });
    });

    it('should return deleted entry status', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('test-key', entry);
      expect(store.delete('test-key')).toBe(true);
      expect(store.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('key1', entry);
      store.set('key2', entry);
      store.clearAll();
      expect(store.size()).toBe(0);
    });

    it('should clear entries by pattern', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('post:1', entry);
      store.set('post:2', entry);
      store.set('category:1', entry);
      
      const count = store.clearPattern('^post:');
      expect(count).toBe(2);
      expect(store.get('post:1')).toBeNull();
      expect(store.get('post:2')).toBeNull();
      expect(store.get('category:1')).not.toBeNull();
    });

    it('should get keys by pattern', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('post:1', entry);
      store.set('post:2', entry);
      store.set('category:1', entry);
      
      const keys = store.getKeysByPattern('^post:');
      expect(keys).toContain('post:1');
      expect(keys).toContain('post:2');
      expect(keys).not.toContain('category:1');
    });

    it('should return correct size', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: 60000,
      };
      expect(store.size()).toBe(0);
      store.set('key1', entry);
      expect(store.size()).toBe(1);
      store.set('key2', entry);
      expect(store.size()).toBe(2);
    });

    it('should get all entries', () => {
      const entry1: CacheEntry<unknown> = {
        data: { value: 1 },
        timestamp: Date.now(),
        ttl: 60000,
      };
      const entry2: CacheEntry<unknown> = {
        data: { value: 2 },
        timestamp: Date.now(),
        ttl: 60000,
      };
      store.set('key1', entry1);
      store.set('key2', entry2);
      
      const all = store.getAll();
      expect(all.size).toBe(2);
    });

    it('should expire entries based on TTL', () => {
      const entry: CacheEntry<unknown> = {
        data: { test: 'value' },
        timestamp: Date.now(),
        ttl: -1000, // Already expired
      };
      store.set('expired-key', entry);
      expect(store.get('expired-key')).toBeNull();
    });
  });
});
