import { RedisCacheAdapter, createRedisCacheAdapter } from '@/lib/cache/redisAdapter';
import type { RedisCacheConfig, RedisCacheOptions } from '@/lib/cache/redisAdapter';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    const mockInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn((key: string) => Promise.resolve(store.get(key) || null)),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((...keys: string[]) => {
        keys.forEach(key => store.delete(key));
        return Promise.resolve(keys.length);
      }),
      keys: jest.fn((pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        const matchingKeys = Array.from(store.keys()).filter(key => regex.test(key));
        return Promise.resolve(matchingKeys);
      }),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'connect') {
          setTimeout(callback, 0);
        }
      }),
    };
    return mockInstance;
  });
});

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;

  beforeEach(async () => {
    const config: RedisCacheConfig = {
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:',
    };

    const options: RedisCacheOptions = {
      config,
      defaultTtl: 60000,
      enableFallback: true,
    };

    adapter = new RedisCacheAdapter(options);
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('Basic Operations', () => {
    it('should set and get data', async () => {
      const testData = { id: 1, title: 'Test Post' };
      const key = 'test-key';

      adapter.set(key, testData, 1000);
      const result = adapter.get<typeof testData>(key);

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = adapter.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete entries', () => {
      const key = 'test-key';
      adapter.set(key, 'data', 1000);
      
      const deleted = adapter.delete(key);
      expect(deleted).toBe(true);
      
      const result = adapter.get(key);
      expect(result).toBeNull();
    });

    it('should clear all entries', () => {
      adapter.set('key1', 'data1', 1000);
      adapter.set('key2', 'data2', 1000);

      adapter.clearAll();

      expect(adapter.get('key1')).toBeNull();
      expect(adapter.get('key2')).toBeNull();
    });

    it('should clear entries by pattern', () => {
      adapter.set('posts:1', 'post1', 1000);
      adapter.set('posts:2', 'post2', 1000);
      adapter.set('categories:1', 'cat1', 1000);

      adapter.clearPattern('^posts:');

      expect(adapter.get('posts:1')).toBeNull();
      expect(adapter.get('posts:2')).toBeNull();
      expect(adapter.get('categories:1')).toEqual('cat1');
    });
  });

  describe('Fallback Mode', () => {
    it('should use fallback when Redis is not connected', () => {
      const fallbackAdapter = createRedisCacheAdapter({
        host: 'invalid-host',
        port: 9999,
      });

      expect(fallbackAdapter.useFallback()).toBe(true);
      
      const testData = { id: 1, title: 'Test' };
      fallbackAdapter.set('key', testData, 1000);
      
      const result = fallbackAdapter.get<typeof testData>('key');
      expect(result).toEqual(testData);
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', () => {
      adapter.set('key1', 'data1', 1000);
      adapter.get('key1');
      adapter.get('non-existent');

      const stats = adapter.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should reset statistics', () => {
      adapter.set('key1', 'data1', 1000);
      adapter.get('key1');
      
      adapter.resetStats();
      
      const stats = adapter.getStats();
      expect(stats.hits).toBe(0);
    });
  });

  describe('Connection Management', () => {
    it('should report connection status', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(adapter.isReady()).toBe(true);
    });

    it('should disconnect properly', async () => {
      await adapter.disconnect();
      expect(adapter.isReady()).toBe(false);
    });
  });
});

describe('createRedisCacheAdapter', () => {
  it('should create adapter with default config', () => {
    const adapter = createRedisCacheAdapter();
    expect(adapter).toBeInstanceOf(RedisCacheAdapter);
  });

  it('should create adapter with custom config', () => {
    const adapter = createRedisCacheAdapter({
      host: 'custom-host',
      port: 6380,
      keyPrefix: 'custom:',
    });
    expect(adapter).toBeInstanceOf(RedisCacheAdapter);
  });
});
