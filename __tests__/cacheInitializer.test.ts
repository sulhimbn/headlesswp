import { CacheInitializer, cacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

describe('CacheInitializer', () => {
  let mockCacheWarmer: jest.Mocked<typeof cacheWarmer>;
  let mockLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheWarmer = cacheWarmer as jest.Mocked<typeof cacheWarmer>;
    mockLogger = logger as jest.Mocked<typeof logger>;
  });

  describe('isInitialized()', () => {
    let initializer: CacheInitializer;

    beforeEach(() => {
      initializer = new CacheInitializer();
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 1,
        success: 1,
        failed: 0,
        results: [],
      });
    });

    it('should return false initially', () => {
      expect(initializer.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      await initializer.initialize();
      expect(initializer.isInitialized()).toBe(true);
    });
  });

  describe('initialize()', () => {
    let initializer: CacheInitializer;

    beforeEach(() => {
      initializer = new CacheInitializer();
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 1,
        success: 1,
        failed: 0,
        results: [],
      });
    });

    it('should return immediately if already initialized', async () => {
      await initializer.initialize();
      const result1 = initializer.isInitialized();

      const promise = initializer.initialize();
      const result2 = await promise;

      expect(result1).toBe(true);
      expect(result2).toBeUndefined();
      expect(mockCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should call warmAll when not initialized', async () => {
      const promise = initializer.initialize();
      expect(initializer.isInitialized()).toBe(false);

      await promise;
      expect(initializer.isInitialized()).toBe(true);
      expect(mockCacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should return existing promise if initialization in progress', async () => {
      let resolveWarmAll: (value: { total: number; success: number; failed: number; results: unknown[] }) => void;
      mockCacheWarmer.warmAll.mockImplementation(
        () => new Promise((resolve) => { resolveWarmAll = resolve as (value: { total: number; success: number; failed: number; results: unknown[] }) => void; })
      );

      const promise1 = initializer.initialize();
      const promise2 = initializer.initialize();

      expect(mockCacheWarmer.warmAll).toHaveBeenCalledTimes(1);

      resolveWarmAll!({ total: 1, success: 1, failed: 0, results: [] });
      await promise1;
      await promise2;
    });

    it('should only call warmAll once when called multiple times during initialization', async () => {
      let resolveWarmAll: (value: { total: number; success: number; failed: number; results: unknown[] }) => void;
      mockCacheWarmer.warmAll.mockImplementation(
        () => new Promise((resolve) => { resolveWarmAll = resolve as (value: { total: number; success: number; failed: number; results: unknown[] }) => void; })
      );

      initializer.initialize();
      initializer.initialize();
      initializer.initialize();

      expect(mockCacheWarmer.warmAll).toHaveBeenCalledTimes(1);

      resolveWarmAll!({ total: 1, success: 1, failed: 0, results: [] });
    });

    it('should log info message when starting initialization', async () => {
      await initializer.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      );
    });
  });

  describe('doInitialize() - successful initialization', () => {
    let initializer: CacheInitializer;

    beforeEach(() => {
      initializer = new CacheInitializer();
    });

    it('should set initialized to true on success', async () => {
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 1,
        success: 1,
        failed: 0,
        results: [],
      });

      await initializer.initialize();

      expect(initializer.isInitialized()).toBe(true);
    });

    it('should log info when no failures', async () => {
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 1,
        success: 1,
        failed: 0,
        results: [],
      });

      await initializer.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 1/1',
        { module: 'CacheInitializer', results: [] }
      );
    });

    it('should log warn when there are failures', async () => {
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [{ name: 'posts', status: 'failed', error: 'error' }],
      });

      await initializer.initialize();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should not log info when there are failures', async () => {
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [{ name: 'posts', status: 'failed', error: 'error' }],
      });

      await initializer.initialize();

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('completed:'),
        expect.any(Object)
      );
    });

    it('should log warn with multiple failures', async () => {
      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 2,
        failed: 3,
        results: [
          { name: 'posts', status: 'failed', error: 'error1' },
          { name: 'categories', status: 'failed', error: 'error2' },
          { name: 'tags', status: 'failed', error: 'error3' },
        ],
      });

      await initializer.initialize();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 3/5',
        expect.any(Object)
      );
    });
  });

  describe('doInitialize() - failed initialization', () => {
    let initializer: CacheInitializer;

    beforeEach(() => {
      initializer = new CacheInitializer();
    });

    it('should set initialized to false on error', async () => {
      const error = new Error('Cache warming failed');
      mockCacheWarmer.warmAll.mockRejectedValue(error);

      await expect(initializer.initialize()).rejects.toThrow('Cache warming failed');
      expect(initializer.isInitialized()).toBe(false);
    });

    it('should log error when initialization fails', async () => {
      const error = new Error('Cache warming failed');
      mockCacheWarmer.warmAll.mockRejectedValue(error);

      await expect(initializer.initialize()).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      );
    });

    it('should reset initPromise to allow retry after failure', async () => {
      const error = new Error('Cache warming failed');
      mockCacheWarmer.warmAll.mockRejectedValue(error);

      await expect(initializer.initialize()).rejects.toThrow();
      expect(initializer.isInitialized()).toBe(false);

      mockCacheWarmer.warmAll.mockResolvedValue({
        total: 1,
        success: 1,
        failed: 0,
        results: [],
      });

      await initializer.initialize();
      expect(initializer.isInitialized()).toBe(true);
      expect(mockCacheWarmer.warmAll).toHaveBeenCalledTimes(2);
    });

    it('should rethrow the original error', async () => {
      const originalError = new Error('Original error message');
      mockCacheWarmer.warmAll.mockRejectedValue(originalError);

      await expect(initializer.initialize()).rejects.toThrow('Original error message');
    });

    it('should not set initialized on error', async () => {
      const error = new Error('Cache warming failed');
      mockCacheWarmer.warmAll.mockRejectedValue(error);

      await expect(initializer.initialize()).rejects.toThrow();
      expect(initializer.isInitialized()).toBe(false);
    });
  });

  describe('exported singleton instance', () => {
    it('should export cacheInitializer as singleton', () => {
      expect(cacheInitializer).toBeDefined();
      expect(typeof cacheInitializer.initialize).toBe('function');
      expect(typeof cacheInitializer.isInitialized).toBe('function');
    });

    it('should export default cacheInitializer', () => {
      expect(cacheInitializer).toBeDefined();
    });
  });
});
