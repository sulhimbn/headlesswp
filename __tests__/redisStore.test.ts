import { MemoryCacheStore } from '@/lib/cache/stores/memoryStore';
import type { ICacheStore, CacheStoreOptions } from '@/lib/cache/types';

describe('MemoryCacheStore', () => {
  let store: MemoryCacheStore;

  beforeEach(() => {
    store = new MemoryCacheStore({ keyPrefix: 'test:' });
  });

  afterEach(async () => {
    await store.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get data', async () => {
      await store.set('key1', { data: 'value' }, 60000);
      const result = await store.get<{ data: string }>('key1');
      
      expect(result).toEqual({ data: 'value' });
    });

    it('should return null for non-existent key', async () => {
      const result = await store.get('non-existent');
      
      expect(result).toBeNull();
    });

    it('should delete data', async () => {
      await store.set('key1', 'value', 60000);
      const deleted = await store.delete('key1');
      const result = await store.get('key1');
      
      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await store.delete('non-existent');
      
      expect(deleted).toBe(false);
    });

    it('should clear all data', async () => {
      await store.set('key1', 'value1', 60000);
      await store.set('key2', 'value2', 60000);
      
      await store.clear();
      
      expect(await store.get('key1')).toBeNull();
      expect(await store.get('key2')).toBeNull();
    });
  });

  describe('Key Prefix', () => {
    it('should use key prefix', async () => {
      const storeWithPrefix = new MemoryCacheStore({ keyPrefix: 'myapp:' });
      await storeWithPrefix.set('key', 'value', 60000);
      
      const keys = await storeWithPrefix.keys();
      
      expect(keys).toContain('key');
    });
  });

  describe('Keys Pattern', () => {
    it('should return all keys without pattern', async () => {
      await store.set('key1', 'value1', 60000);
      await store.set('key2', 'value2', 60000);
      
      const keys = await store.keys();
      
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should filter keys by pattern', async () => {
      await store.set('posts:1', 'value1', 60000);
      await store.set('posts:2', 'value2', 60000);
      await store.set('categories:1', 'value3', 60000);
      
      const keys = await store.keys('posts:.*');
      
      expect(keys).toHaveLength(2);
      expect(keys).toContain('posts:1');
      expect(keys).toContain('posts:2');
    });
  });

  describe('Health Check', () => {
    it('should return true for health check', async () => {
      const isHealthy = await store.healthCheck();
      
      expect(isHealthy).toBe(true);
    });
  });

  describe('TTL', () => {
    it('should return null for expired entry', async () => {
      await store.set('key1', 'value', 1);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await store.get('key1');
      
      expect(result).toBeNull();
    });

    it('should not expire valid entry', async () => {
      await store.set('key1', 'value', 60000);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await store.get('key1');
      
      expect(result).toBe('value');
    });
  });

  describe('Close', () => {
    it('should clear store on close', async () => {
      await store.set('key1', 'value', 60000);
      
      await store.close();
      
      expect(await store.get('key1')).toBeNull();
    });
  });

  describe('Complex Data', () => {
    it('should store complex objects', async () => {
      const complexData = {
        id: 1,
        title: 'Test Post',
        content: 'Some content',
        metadata: {
          author: 'John Doe',
          date: '2024-01-01',
        },
        tags: ['tag1', 'tag2'],
      };
      
      await store.set('post:1', complexData, 60000);
      const result = await store.get<typeof complexData>('post:1');
      
      expect(result).toEqual(complexData);
    });

    it('should store arrays', async () => {
      const data = [1, 2, 3, 4, 5];
      
      await store.set('numbers', data, 60000);
      const result = await store.get<number[]>('numbers');
      
      expect(result).toEqual(data);
    });
  });
});

describe('Cache Store Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create memory store when no Redis URL', async () => {
    delete process.env.REDIS_URL;
    
    const { createCacheStore } = await import('@/lib/cache/cacheStoreFactory');
    const store = await createCacheStore({ fallbackToMemory: true });
    
    expect(store).toBeInstanceOf(MemoryCacheStore);
    await store.close();
  });

  it('should fallback to memory when Redis unavailable', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    const { createCacheStore } = await import('@/lib/cache/cacheStoreFactory');
    const store = await createCacheStore({ fallbackToMemory: true });
    
    expect(store).toBeInstanceOf(MemoryCacheStore);
    await store.close();
  });
});

describe('Cache Store Types', () => {
  it('should export CacheStoreType', async () => {
    const { detectCacheStoreType } = await import('@/lib/cache/cacheStoreFactory');
    
    const originalEnv = process.env;
    delete process.env.REDIS_URL;
    
    expect(detectCacheStoreType()).toBe('memory');
    
    process.env = originalEnv;
  });

  it('should detect Redis type when URL is set', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    const { detectCacheStoreType } = await import('@/lib/cache/cacheStoreFactory');
    
    expect(detectCacheStoreType()).toBe('redis');
    
    delete process.env.REDIS_URL;
  });
});

describe('Cache Manager with External Store', () => {
  it('should initialize with memory store', () => {
    const { cacheManager } = require('@/lib/cache');
    
    const info = cacheManager.getStoreInfo();
    
    expect(info.type).toBe('memory');
    expect(info.isConnected).toBe(true);
  });

  it('should perform health check', async () => {
    const { cacheManager } = require('@/lib/cache');
    
    const isHealthy = await cacheManager.healthCheck();
    
    expect(isHealthy).toBe(true);
  });
});

describe('Cache Manager Async Methods', () => {
  let cacheManager: any;

  beforeEach(() => {
    jest.resetModules();
    const cache = require('@/lib/cache');
    cacheManager = cache.cacheManager;
    cacheManager.clearAll();
    cacheManager.resetStats();
  });

  describe('getAsync', () => {
    it('should return null for non-existent key', async () => {
      const result = await cacheManager.getAsync('non-existent');
      
      expect(result).toBeNull();
    });

    it('should return cached data', async () => {
      cacheManager.set('key1', 'value1', 60000);
      
      const result = await cacheManager.getAsync('key1');
      
      expect(result).toBe('value1');
    });
  });

  describe('setAsync', () => {
    it('should set cache entry', async () => {
      await cacheManager.setAsync('key1', 'value1', 60000);
      
      const result = cacheManager.get('key1');
      
      expect(result).toBe('value1');
    });

    it('should set entry with dependencies', async () => {
      await cacheManager.setAsync('post:1', { title: 'Test' }, 60000, ['category:1']);
      
      const result = cacheManager.get('post:1');
      expect(result).toEqual({ title: 'Test' });
      
      const deps = cacheManager.getDependencies('post:1');
      expect(deps.dependencies).toContain('category:1');
    });
  });

  describe('deleteAsync', () => {
    it('should delete cache entry', async () => {
      cacheManager.set('key1', 'value1', 60000);
      
      const deleted = await cacheManager.deleteAsync('key1');
      
      expect(deleted).toBe(true);
      expect(cacheManager.get('key1')).toBeNull();
    });
  });

  describe('invalidateAsync', () => {
    it('should invalidate entry', async () => {
      cacheManager.set('key1', 'value1', 60000);
      
      await cacheManager.invalidateAsync('key1');
      
      expect(cacheManager.get('key1')).toBeNull();
    });
  });

  describe('clearAsync', () => {
    it('should clear all entries', async () => {
      cacheManager.set('key1', 'value1', 60000);
      cacheManager.set('key2', 'value2', 60000);
      
      await cacheManager.clearAsync();
      
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
    });
  });
});
