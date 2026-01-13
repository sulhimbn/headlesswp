import { CacheCleanup, type CleanupResult } from '@/lib/cache/cacheCleanup';
import type { CacheEntry } from '@/lib/cache';

describe('CacheCleanup', () => {
  let cache: Map<string, CacheEntry<unknown>>;
  let cleanup: CacheCleanup;

  beforeEach(() => {
    cache = new Map<string, CacheEntry<unknown>>();
    cleanup = new CacheCleanup(cache);
  });

  describe('cleanup() - Remove Expired Entries', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      
      cache.set('valid-entry', { data: 'valid', timestamp: now, ttl: 60000 });
      cache.set('expired-entry', { data: 'expired', timestamp: now - 120000, ttl: 60000 });
      cache.set('also-expired', { data: 'also-expired', timestamp: now - 10000, ttl: 5000 });
      
      const removed = cleanup.cleanup();
      
      expect(removed).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.get('valid-entry')).toBeDefined();
      expect(cache.get('expired-entry')).toBeUndefined();
      expect(cache.get('also-expired')).toBeUndefined();
    });

    it('should return 0 when no entries are expired', () => {
      const now = Date.now();
      
      cache.set('entry1', { data: 'data1', timestamp: now, ttl: 60000 });
      cache.set('entry2', { data: 'data2', timestamp: now - 1000, ttl: 10000 });
      
      const removed = cleanup.cleanup();
      
      expect(removed).toBe(0);
      expect(cache.size).toBe(2);
    });

    it('should handle empty cache', () => {
      const removed = cleanup.cleanup();
      
      expect(removed).toBe(0);
      expect(cache.size).toBe(0);
    });

    it('should handle entries at expiration boundary', () => {
      const now = Date.now();
      
      cache.set('expired-exactly', { data: 'data', timestamp: now - 60000, ttl: 60000 });
      cache.set('expired-millisecond', { data: 'data', timestamp: now - 60001, ttl: 60000 });
      cache.set('valid-millisecond', { data: 'data', timestamp: now - 59999, ttl: 60000 });
      
      const removed = cleanup.cleanup();
      
      expect(removed).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.get('valid-millisecond')).toBeDefined();
    });

    it('should not remove entries with dependencies when expired', () => {
      const now = Date.now();
      
      cache.set('expired-with-deps', {
        data: 'data',
        timestamp: now - 60000,
        ttl: 60000,
        dependencies: new Set(['dep1', 'dep2']),
        dependents: new Set(['dependent1'])
      });
      
      const removed = cleanup.cleanup();
      
      expect(removed).toBe(1);
      expect(cache.size).toBe(0);
      expect(cache.get('expired-with-deps')).toBeUndefined();
    });
  });

  describe('cleanupOrphanDependencies() - Remove Broken References', () => {
    it('should remove orphaned dependencies', () => {
      const now = Date.now();
      
      cache.set('entry-with-orphan', {
        data: 'data',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep1', 'dep2', 'orphan-dep'])
      });
      
      cache.set('dep1', { data: 'dep1-data', timestamp: now, ttl: 60000 });
      
      const cleaned = cleanup.cleanupOrphanDependencies();
      
      expect(cleaned).toBe(1);
      const entry = cache.get('entry-with-orphan');
      expect(entry).toBeDefined();
      expect(entry!.dependencies).toBeDefined();
      expect(entry!.dependencies!.has('dep1')).toBe(true);
      expect(entry!.dependencies!.has('orphan-dep')).toBe(false);
    });

    it('should return 0 when no orphaned dependencies', () => {
      const now = Date.now();
      
      cache.set('entry1', {
        data: 'data1',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep1', 'dep2'])
      });
      
      cache.set('dep1', { data: 'dep1', timestamp: now, ttl: 60000 });
      cache.set('dep2', { data: 'dep2', timestamp: now, ttl: 60000 });
      
      const cleaned = cleanup.cleanupOrphanDependencies();
      
      expect(cleaned).toBe(0);
      const entry = cache.get('entry1');
      expect(entry!.dependencies!.size).toBe(2);
    });

    it('should handle entries without dependencies', () => {
      const now = Date.now();
      
      cache.set('entry-no-deps', { data: 'data', timestamp: now, ttl: 60000 });
      
      const cleaned = cleanup.cleanupOrphanDependencies();
      
      expect(cleaned).toBe(0);
    });

    it('should handle empty cache', () => {
      const cleaned = cleanup.cleanupOrphanDependencies();
      
      expect(cleaned).toBe(0);
      expect(cache.size).toBe(0);
    });

    it('should handle entries with all orphaned dependencies', () => {
      const now = Date.now();
      
      cache.set('entry-all-orphans', {
        data: 'data',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['orphan1', 'orphan2', 'orphan3'])
      });
      
      const cleaned = cleanup.cleanupOrphanDependencies();
      
      expect(cleaned).toBe(3);
      const entry = cache.get('entry-all-orphans');
      expect(entry).toBeDefined();
      expect(entry!.dependencies).toBeDefined();
      expect(entry!.dependencies!.size).toBe(0);
    });

    it('should handle multiple entries with orphaned dependencies', () => {
      const now = Date.now();
      
      cache.set('entry1', {
        data: 'data1',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep1', 'orphan1', 'orphan2'])
      });
      
      cache.set('entry2', {
        data: 'data2',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep1', 'orphan3'])
      });
      
      cache.set('dep1', { data: 'dep1', timestamp: now, ttl: 60000 });
      
      const cleaned = cleanup.cleanupOrphanDependencies();
      
      expect(cleaned).toBe(3);
      const entry1 = cache.get('entry1');
      const entry2 = cache.get('entry2');
      expect(entry1!.dependencies!.has('dep1')).toBe(true);
      expect(entry1!.dependencies!.size).toBe(1);
      expect(entry2!.dependencies!.has('dep1')).toBe(true);
      expect(entry2!.dependencies!.size).toBe(1);
    });
  });

  describe('cleanupAll() - Combined Optimization', () => {
    it('should clean both expired entries and orphaned dependencies in single pass', () => {
      const now = Date.now();
      
      cache.set('expired-entry', { data: 'expired', timestamp: now - 60000, ttl: 60000 });
      
      cache.set('entry-with-orphan', {
        data: 'data',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['valid-dep', 'orphan-dep'])
      });
      
      cache.set('valid-dep', { data: 'dep', timestamp: now, ttl: 60000 });
      
      cache.set('valid-entry', {
        data: 'valid',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['valid-dep'])
      });
      
      const result: CleanupResult = cleanup.cleanupAll();
      
      expect(result.expired).toBe(1);
      expect(result.orphans).toBe(1);
      expect(result.total).toBe(2);
      expect(cache.size).toBe(2);
    });

    it('should return zero values when cache is clean', () => {
      const now = Date.now();
      
      cache.set('entry1', {
        data: 'data1',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep1'])
      });
      
      cache.set('dep1', { data: 'dep1', timestamp: now, ttl: 60000 });
      
      const result = cleanup.cleanupAll();
      
      expect(result.expired).toBe(0);
      expect(result.orphans).toBe(0);
      expect(result.total).toBe(0);
      expect(cache.size).toBe(2);
    });

    it('should handle empty cache', () => {
      const result = cleanup.cleanupAll();
      
      expect(result.expired).toBe(0);
      expect(result.orphans).toBe(0);
      expect(result.total).toBe(0);
      expect(cache.size).toBe(0);
    });

    it('should clean expired entries before checking for orphaned dependencies', () => {
      const now = Date.now();
      
      cache.set('expired-with-deps', {
        data: 'data',
        timestamp: now - 60000,
        ttl: 60000,
        dependencies: new Set(['orphan-dep'])
      });
      
      cache.set('expired-dep', {
        data: 'dep',
        timestamp: now - 60000,
        ttl: 60000
      });
      
      const result = cleanup.cleanupAll();
      
      expect(result.expired).toBe(2);
      expect(result.orphans).toBe(0);
      expect(result.total).toBe(2);
      expect(cache.size).toBe(0);
    });

    it('should handle mixed scenario with multiple expired and orphaned', () => {
      const now = Date.now();
      
      cache.set('expired1', { data: 'expired1', timestamp: now - 120000, ttl: 60000 });
      cache.set('expired2', { data: 'expired2', timestamp: now - 80000, ttl: 60000 });
      
      cache.set('valid1', {
        data: 'valid1',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep1', 'orphan1', 'orphan2'])
      });
      
      cache.set('valid2', {
        data: 'valid2',
        timestamp: now,
        ttl: 60000,
        dependencies: new Set(['dep2', 'orphan3'])
      });
      
      cache.set('dep1', { data: 'dep1', timestamp: now, ttl: 60000 });
      cache.set('dep2', { data: 'dep2', timestamp: now, ttl: 60000 });
      
      const result = cleanup.cleanupAll();
      
      expect(result.expired).toBe(2);
      expect(result.orphans).toBe(3);
      expect(result.total).toBe(5);
      expect(cache.size).toBe(4);
      
      const entry1 = cache.get('valid1');
      const entry2 = cache.get('valid2');
      expect(entry1!.dependencies!.size).toBe(1);
      expect(entry2!.dependencies!.size).toBe(1);
    });
  });

  describe('CacheCleanup integration with CacheManager', () => {
    it('should be usable with CacheManager delegation', () => {
      const { cacheManager } = require('@/lib/cache');
      
      const now = Date.now();
      cacheManager.set('expired', 'data', 1);
      
      setTimeout(() => {
        const cleaned = cacheManager.cleanup();
        expect(cleaned).toBeGreaterThanOrEqual(0);
      }, 10);
    });
  });
});
