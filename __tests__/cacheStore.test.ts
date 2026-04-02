import { InMemoryCacheStore } from '@/lib/cache/stores/memoryStore';
import { createCacheStore, initializeCacheStore, getCacheStore, clearCacheStore } from '@/lib/cache/cacheStoreFactory';

describe('InMemoryCacheStore', () => {
  let store: InMemoryCacheStore;

  beforeEach(() => {
    store = new InMemoryCacheStore({ prefix: 'test:', defaultTtl: 60000 });
  });

  describe('constructor', () => {
    it('should create store with default options', () => {
      const defaultStore = new InMemoryCacheStore();
      expect(defaultStore).toBeDefined();
    });

    it('should use custom prefix', () => {
      const prefixedStore = new InMemoryCacheStore({ prefix: 'myapp:' });
      expect(prefixedStore).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return null for nonexistent key', async () => {
      const result = await store.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return data when exists and not expired', async () => {
      const testData = { id: 1, title: 'Test' };
      await store.set('post:1', testData, 60000);
      const result = await store.get('post:1');
      expect(result).toEqual(testData);
    });

    it('should return null when expired', async () => {
      const testData = { id: 1 };
      await store.set('post:1', testData, 1);
      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await store.get('post:1');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store data', async () => {
      await store.set('key1', { value: 'test' }, 60000);
      const result = await store.get('key1');
      expect(result).toEqual({ value: 'test' });
    });

    it('should store different data types', async () => {
      await store.set('string', 'hello', 60000);
      await store.set('number', 42, 60000);
      await store.set('array', [1, 2, 3], 60000);
      
      expect(await store.get('string')).toBe('hello');
      expect(await store.get('number')).toBe(42);
      expect(await store.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('delete', () => {
    it('should return true when key existed', async () => {
      await store.set('key1', 'value', 60000);
      const result = await store.delete('key1');
      expect(result).toBe(true);
      expect(await store.get('key1')).toBeNull();
    });

    it('should return false when key did not exist', async () => {
      const result = await store.delete('nonexistent');
      expect(result).toBe(false);
    });

    it('should delete specific key without affecting others', async () => {
      await store.set('key1', 'val1', 60000);
      await store.set('key2', 'val2', 60000);
      await store.delete('key1');
      
      expect(await store.get('key1')).toBeNull();
      expect(await store.get('key2')).toEqual('val2');
    });
  });

  describe('clearAll', () => {
    it('should clear all entries', async () => {
      await store.set('key1', 'val1', 60000);
      await store.set('key2', 'val2', 60000);
      await store.clearAll();
      expect(await store.get('key1')).toBeNull();
      expect(await store.get('key2')).toBeNull();
    });

    it('should handle empty store', async () => {
      await expect(store.clearAll()).resolves.not.toThrow();
    });
  });

  describe('getKeysByPattern', () => {
    it('should return matching keys with regex pattern', async () => {
      await store.set('post:1', {}, 60000);
      await store.set('post:2', {}, 60000);
      await store.set('category:1', {}, 60000);
      
      const keys = await store.getKeysByPattern('^post:');
      expect(keys).toHaveLength(2);
    });

    it('should return all keys when pattern matches all', async () => {
      await store.set('key1', 'val1', 60000);
      await store.set('key2', 'val2', 60000);
      
      const keys = await store.getKeysByPattern('key.*');
      expect(keys).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      await store.set('post:1', {}, 60000);
      const keys = await store.getKeysByPattern('^category:');
      expect(keys).toHaveLength(0);
    });
  });

  describe('healthCheck', () => {
    it('should always return true', async () => {
      const result = await store.healthCheck();
      expect(result).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('should always return true', () => {
      expect(store.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should clear all data', async () => {
      await store.set('key1', 'val1', 60000);
      await store.disconnect();
      expect(await store.get('key1')).toBeNull();
    });
  });

  describe('registerDependencies', () => {
    it('should register dependencies for a key', async () => {
      await store.set('post:1', { data: true }, 60000);
      await store.registerDependencies('post:1', ['category:1', 'tag:2']);
      
      const deps = await store.getDependencies('post:1');
      expect(deps.dependencies).toContain('category:1');
      expect(deps.dependencies).toContain('tag:2');
    });

    it('should handle key with no existing entry', async () => {
      await store.registerDependencies('new:key', ['dep:1']);
      const deps = await store.getDependencies('new:key');
      expect(deps.dependencies).toEqual([]);
    });
  });

  describe('getDependencies', () => {
    it('should return empty for nonexistent key', async () => {
      const deps = await store.getDependencies('nonexistent');
      expect(deps.dependencies).toEqual([]);
      expect(deps.dependents).toEqual([]);
    });

    it('should track dependents', async () => {
      await store.set('category:1', { id: 1 }, 60000);
      await store.registerDependencies('category:1', []);
      
      await store.set('post:1', { id: 1 }, 60000);
      await store.registerDependencies('post:1', ['category:1']);
      
      const deps = await store.getDependencies('category:1');
      expect(deps.dependents).toContain('post:1');
    });
  });

  describe('invalidateWithDependents', () => {
    it('should invalidate key and its dependents', async () => {
      await store.set('category:1', { id: 1 }, 60000);
      await store.set('post:1', { id: 1 }, 60000);
      
      await store.registerDependencies('post:1', ['category:1']);
      
      const count = await store.invalidateWithDependents('category:1');
      expect(count).toBeGreaterThan(0);
      expect(await store.get('category:1')).toBeNull();
    });

    it('should return 0 when key does not exist', async () => {
      const count = await store.invalidateWithDependents('nonexistent');
      expect(count).toBe(0);
    });

    it('should cascade through multiple levels', async () => {
      await store.set('cat:1', { id: 1 }, 60000);
      await store.set('post:1', { id: 1 }, 60000);
      await store.set('list:1', { id: 1 }, 60000);
      
      await store.registerDependencies('post:1', ['cat:1']);
      await store.registerDependencies('list:1', ['post:1']);
      
      const count = await store.invalidateWithDependents('cat:1');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Cache Store Factory', () => {
  beforeEach(() => {
    clearCacheStore();
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    clearCacheStore();
  });

  describe('createCacheStore', () => {
    it('should create in-memory store when no Redis URL', () => {
      const store = createCacheStore();
      expect(store).toBeInstanceOf(InMemoryCacheStore);
    });

    it('should create store with explicit type', () => {
      const store = createCacheStore({ storeType: 'memory' });
      expect(store).toBeInstanceOf(InMemoryCacheStore);
    });

    it('should return cached store on subsequent calls', () => {
      const store1 = createCacheStore();
      const store2 = createCacheStore();
      expect(store1).toBe(store2);
    });
  });

  describe('initializeCacheStore', () => {
    it('should return in-memory store', async () => {
      const store = await initializeCacheStore();
      expect(store).toBeInstanceOf(InMemoryCacheStore);
    });
  });

  describe('getCacheStore', () => {
    it('should return null initially', () => {
      expect(getCacheStore()).toBeNull();
    });

    it('should return store after creation', () => {
      createCacheStore();
      expect(getCacheStore()).not.toBeNull();
    });
  });

  describe('clearCacheStore', () => {
    it('should reset cached store', () => {
      createCacheStore();
      clearCacheStore();
      expect(getCacheStore()).toBeNull();
    });
  });
});