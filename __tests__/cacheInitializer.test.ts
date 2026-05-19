import { cacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

describe('CacheInitializer', () => {
  let mockedCacheWarmer: jest.Mocked<typeof cacheWarmer>;
  let mockedLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCacheWarmer = cacheWarmer as jest.Mocked<typeof cacheWarmer>;
    mockedLogger = logger as jest.Mocked<typeof logger>;

    // Reset the singleton state
    (cacheInitializer as any).initialized = false;
    (cacheInitializer as any).initPromise = null;
  });

  describe('initialize()', () => {
    it('should return early if already initialized', async () => {
      const CacheInitializer = require('@/lib/services/cacheInitializer').cacheInitializer;
      (CacheInitializer as any).initialized = true;

      await CacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should return existing initPromise if initialization is in progress', async () => {
      const testInstance = Object.getPrototypeOf(cacheInitializer).constructor;
      const privateInit = testInstance.prototype.initialize;

      // Get internal state by calling initialize which stores initPromise
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      // Trigger first init to set initPromise
      const firstCall = cacheInitializer.initialize();
      expect(firstCall).toBeDefined();

      // Now simulate having initPromise by directly testing the branch
      // For the singleton, we verify it returns a promise on second call
      const secondCall = cacheInitializer.initialize();
      expect(secondCall).toBeDefined();
      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should call doInitialize on first call', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalled();
    });

    it('should return a promise from initialize', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      const result = cacheInitializer.initialize();

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe('doInitialize() - success scenarios', () => {
    it('should log info message when initialization starts', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await (cacheInitializer as any).doInitialize();

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
          { name: 'latest posts', status: 'success' },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success' },
        ],
      });

      await (cacheInitializer as any).doInitialize();

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should log info when all succeed', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'latest posts', status: 'success' },
          { name: 'categories', status: 'success' },
          { name: 'tags', status: 'success' },
        ],
      });

      await (cacheInitializer as any).doInitialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        {
          module: 'CacheInitializer',
          results: expect.any(Array),
        }
      );
    });

    it('should set initialized to true on success', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await (cacheInitializer as any).doInitialize();

      expect((cacheInitializer as any).initialized).toBe(true);
    });
  });

  describe('doInitialize() - error handling', () => {
    it('should log error when initialization fails', async () => {
      const error = new Error('Cache warming failed');
      mockedCacheWarmer.warmAll.mockRejectedValue(error);

      await expect((cacheInitializer as any).doInitialize()).rejects.toThrow();

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      );
    });

    it('should set initialized to false on failure', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Cache warming failed'));

      await expect((cacheInitializer as any).doInitialize()).rejects.toThrow();

      expect((cacheInitializer as any).initialized).toBe(false);
    });

    it('should reset initPromise to null on failure', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Cache warming failed'));

      await expect((cacheInitializer as any).doInitialize()).rejects.toThrow();

      expect((cacheInitializer as any).initPromise).toBeNull();
    });

    it('should rethrow the error', async () => {
      const error = new Error('Cache warming failed');
      mockedCacheWarmer.warmAll.mockRejectedValue(error);

      await expect((cacheInitializer as any).doInitialize()).rejects.toThrow(error);
    });
  });

  describe('isInitialized()', () => {
    it('should return true when initialized is true', () => {
      (cacheInitializer as any).initialized = true;

      const result = cacheInitializer.isInitialized();

      expect(result).toBe(true);
    });

    it('should return false when initialized is false', () => {
      (cacheInitializer as any).initialized = false;

      const result = cacheInitializer.isInitialized();

      expect(result).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple initialize calls after first completes', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should allow parallel initialize calls', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      const promise1 = cacheInitializer.initialize();
      const promise2 = cacheInitializer.initialize();

      await Promise.all([promise1, promise2]);

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization after failure', async () => {
      mockedCacheWarmer.warmAll
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({
          total: 3,
          success: 3,
          failed: 0,
          results: [],
        });

      await expect(cacheInitializer.initialize()).rejects.toThrow();

      (cacheInitializer as any).initialized = false;
      (cacheInitializer as any).initPromise = null;

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(2);
    });

    it('should track initialization state correctly through lifecycle', async () => {
      expect(cacheInitializer.isInitialized()).toBe(false);

      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      const initPromise = cacheInitializer.initialize();

      expect((cacheInitializer as any).initPromise).toBeDefined();

      await initPromise;

      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });
});