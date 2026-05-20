import { cacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

describe('cacheInitializer', () => {
  let mockedCacheWarmer: jest.Mocked<typeof cacheWarmer>;
  let mockedLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCacheWarmer = cacheWarmer as jest.Mocked<typeof cacheWarmer>;
    mockedLogger = logger as jest.Mocked<typeof logger>;
    
    (cacheInitializer as any).initialized = false;
    (cacheInitializer as any).initPromise = null;
  });

  describe('initialize()', () => {
    it('should successfully initialize cache warming', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'success', latency: 50 },
          { name: 'tags', status: 'success', latency: 30 },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle partial failures during initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success', latency: 30 },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle all failures during initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 0,
        failed: 3,
        results: [
          { name: 'latest posts', status: 'failed', error: 'Error 1' },
          { name: 'categories', status: 'failed', error: 'Error 2' },
          { name: 'tags', status: 'failed', error: 'Error 3' },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 3/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should skip initialization if already initialized', async () => {
      (cacheInitializer as any).initialized = true;
      (cacheInitializer as any).initPromise = Promise.resolve();

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should return existing promise if initialization in progress', async () => {
      let resolveWarmAll: (value: any) => void;
      mockedCacheWarmer.warmAll.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveWarmAll = resolve;
        });
      });

      const promise1 = cacheInitializer.initialize();
      const promise2 = cacheInitializer.initialize();

      resolveWarmAll!({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await promise1;
      await promise2;

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization error and reset state', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('API failure'));

      await expect(cacheInitializer.initialize()).rejects.toThrow('API failure');

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        expect.any(Error),
        { module: 'CacheInitializer' }
      );
      expect(cacheInitializer.isInitialized()).toBe(false);
      expect((cacheInitializer as any).initPromise).toBe(null);
    });

    it('should handle different error types during initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue('String error');

      await expect(cacheInitializer.initialize()).rejects.toEqual('String error');

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        'String error',
        { module: 'CacheInitializer' }
      );
    });

    it('should allow re-initialization after failure', async () => {
      mockedCacheWarmer.warmAll
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({
          total: 3,
          success: 3,
          failed: 0,
          results: [],
        });

      await expect(cacheInitializer.initialize()).rejects.toThrow('First failure');
      expect(cacheInitializer.isInitialized()).toBe(false);

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle zero total operations', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 0,
        success: 0,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 0/0',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should handle cache warming with empty results', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        { module: 'CacheInitializer', results: [] }
      );
    });

    it('should track initialization state correctly', async () => {
      expect(cacheInitializer.isInitialized()).toBe(false);

      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should set initialized to false on error', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Error'));

      await expect(cacheInitializer.initialize()).rejects.toThrow();

      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should log info message when starting initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      );
    });
  });

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      (cacheInitializer as any).initialized = false;
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should return false after failed initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Error'));

      await expect(cacheInitializer.initialize()).rejects.toThrow();
      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });

  describe('concurrent initialization', () => {
    it('should handle multiple simultaneous initialize calls', async () => {
      let resolveWarmAll: (value: any) => void;
      mockedCacheWarmer.warmAll.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveWarmAll = resolve;
        });
      });

      const promise1 = cacheInitializer.initialize();
      const promise2 = cacheInitializer.initialize();

      resolveWarmAll!({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await promise1;
      await promise2;

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should handle rapid sequential initialize calls', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      await cacheInitializer.initialize();
      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle cache warming returning undefined results', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 0,
        success: 0,
        failed: 0,
        results: undefined as any,
      });

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle mixed success and failure with detailed results', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 1,
        failed: 2,
        results: [
          { name: 'posts', status: 'success' as const, latency: 10 },
          { name: 'categories', status: 'failed' as const, error: 'Failed to fetch' },
          { name: 'tags', status: 'failed' as const, error: 'Network timeout' },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed with failures: 2/3'),
        expect.objectContaining({
          module: 'CacheInitializer',
        })
      );
    });
  });
});
