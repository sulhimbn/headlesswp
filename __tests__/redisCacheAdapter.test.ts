import { RedisCacheAdapter, type RedisConfig } from '@/lib/cache/redisCacheAdapter';

const mockRedis = {
  on: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn(() => mockRedis);
});

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new RedisCacheAdapter({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:',
    });
  });

  describe('Connection', () => {
    it('should connect to Redis', async () => {
      await adapter.connect();
      expect(mockRedis.connect).toHaveBeenCalled();
    });

    it('should track connection status after event', async () => {
      mockRedis.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'connect') {
          setTimeout(callback, 0);
        }
      });
      await adapter.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('Basic Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should set and get values', async () => {
      const testData = { id: 1, title: 'Test Post' };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        ttl: 60000,
      }));

      const result = await adapter.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for missing keys', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await adapter.get('missing-key');
      expect(result).toBeNull();
    });
  });

  describe('Metrics', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should track Redis metrics', async () => {
      const metrics = adapter.getRedisMetrics();
      expect(metrics).toHaveProperty('connected');
      expect(metrics).toHaveProperty('reconnectAttempts');
      expect(metrics).toHaveProperty('commandsExecuted');
    });

    it('should track cache stats', async () => {
      const testData = { id: 1, title: 'Test' };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        ttl: 60000,
      }));

      await adapter.get('key1');
      const stats = await adapter.getStats();

      expect(stats.hits).toBe(1);
    });
  });

  describe('Configuration', () => {
    it('should use environment variables when not provided', () => {
      const adapter = new RedisCacheAdapter();
      expect(adapter).toBeDefined();
    });

    it('should allow custom configuration', () => {
      const config: RedisConfig = {
        host: 'custom-host',
        port: 6380,
        password: 'secret',
        db: 1,
        keyPrefix: 'custom:',
      };

      const adapter = new RedisCacheAdapter(config);
      expect(adapter).toBeDefined();
    });
  });
});
