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
    it('should return immediately if already initialized', async () => {
      (cacheInitializer as any).initialized = true;

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).not.toHaveBeenCalled();
      expect(mockedLogger.info).not.toHaveBeenCalled();
    });

    it('should return existing promise if initialization is in progress', async () => {
      const mockPromise = Promise.resolve();
      (cacheInitializer as any).initPromise = mockPromise;

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should call doInitialize on first call', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'posts', status: 'success', latency: 10 },
          { name: 'categories', status: 'success', latency: 5 },
          { name: 'tags', status: 'success', latency: 5 },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      );
    });

    it('should log warning when there are failures', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'posts', status: 'success', latency: 10 },
          { name: 'categories', status: 'failed', error: 'Network error', latency: 0 },
          { name: 'tags', status: 'success', latency: 5 },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should log success when all operations succeed', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'posts', status: 'success', latency: 10 },
          { name: 'categories', status: 'success', latency: 5 },
          { name: 'tags', status: 'success', latency: 5 },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should set initialized to true after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      expect(cacheInitializer.isInitialized()).toBe(false);

      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should re-initialize after error when called again', async () => {
      mockedCacheWarmer.warmAll
        .mockRejectedValueOnce(new Error('First initialization failed'))
        .mockResolvedValueOnce({
          total: 3,
          success: 3,
          failed: 0,
          results: [],
        });

      try {
        await cacheInitializer.initialize();
      } catch (e) {
        // Expected to fail
      }

      (cacheInitializer as any).initPromise = null;
      (cacheInitializer as any).initialized = false;

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('doInitialize()', () => {
    it('should throw error and reset state on failure', async () => {
      const error = new Error('Cache warming failed');
      mockedCacheWarmer.warmAll.mockRejectedValue(error);

      await expect(cacheInitializer.initialize()).rejects.toThrow(error);

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      );
      expect(cacheInitializer.isInitialized()).toBe(false);
      expect((cacheInitializer as any).initPromise).toBeNull();
    });
  });

  describe('isInitialized()', () => {
    it('should return true when initialized', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should return false when not initialized', () => {
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return false after failed initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Failed'));

      try {
        await cacheInitializer.initialize();
      } catch (e) {
        // Expected
      }

      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });

  describe('concurrent initialization', () => {
    it('should handle multiple concurrent initialize calls', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      const promises = [
        cacheInitializer.initialize(),
        cacheInitializer.initialize(),
        cacheInitializer.initialize(),
      ];

      await Promise.all(promises);

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });
  });
});