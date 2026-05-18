jest.mock('@/lib/services/cacheWarmer', () => ({
  cacheWarmer: {
    warmAll: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CacheInitializer', () => {
  let cacheInitializer: typeof import('@/lib/services/cacheInitializer').cacheInitializer;
  let mockedCacheWarmer: jest.MockedFunction<typeof import('@/lib/services/cacheWarmer').cacheWarmer.warmAll>;
  let mockedLogger: {
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    const { cacheWarmer } = require('@/lib/services/cacheWarmer');
    const { logger } = require('@/lib/utils/logger');
    mockedCacheWarmer = cacheWarmer.warmAll as jest.MockedFunction<typeof cacheWarmer.warmAll>;
    mockedLogger = logger as unknown as typeof mockedLogger;
    
    cacheInitializer = require('@/lib/services/cacheInitializer').cacheInitializer;
  });

  describe('isInitialized()', () => {
    it('should return false initially', () => {
      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('should trigger warmAll on first call', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(mockedCacheWarmer).toHaveBeenCalledTimes(1);
    });

    it('should log initialization start message', async () => {
      mockedCacheWarmer.mockResolvedValue({
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

    it('should log success message when no failures', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [{ name: 'posts', status: 'success' }],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should log warning message when there are failures', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'posts', status: 'success' },
          { name: 'categories', status: 'failed', error: 'Network error' },
        ],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        { module: 'CacheInitializer', results: expect.any(Array) }
      );
    });

    it('should set initialized to true after successful initialization', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should return immediately on second call (already initialized)', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      mockedCacheWarmer.mockClear();
      await cacheInitializer.initialize();

      expect(mockedCacheWarmer).not.toHaveBeenCalled();
    });

    it('isInitialized() should return true after first initialization', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should only trigger warmAll once with concurrent calls', async () => {
      mockedCacheWarmer.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      const promise1 = cacheInitializer.initialize();
      const promise2 = cacheInitializer.initialize();
      const promise3 = cacheInitializer.initialize();

      await Promise.all([promise1, promise2, promise3]);

      expect(mockedCacheWarmer).toHaveBeenCalledTimes(1);
    });

    it('should throw error when cacheWarmer.warmAll() fails', async () => {
      mockedCacheWarmer.mockRejectedValue(new Error('Cache warming failed'));

      await expect(cacheInitializer.initialize()).rejects.toThrow('Cache warming failed');
    });

    it('should log error when initialization fails', async () => {
      const error = new Error('Cache warming failed');
      mockedCacheWarmer.mockRejectedValue(error);

      await expect(cacheInitializer.initialize()).rejects.toThrow();

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      );
    });

    it('should set initialized to false on error', async () => {
      mockedCacheWarmer.mockRejectedValue(new Error('Cache warming failed'));

      await expect(cacheInitializer.initialize()).rejects.toThrow();

      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });
});
