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
        expect.stringContaining('Cache initialization completed with failures'),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should log success message when all succeed', async () => {
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

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed: 3/3'),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should re-throw errors when initialization fails', async () => {
      const initError = new Error('Initialization failed');
      mockedCacheWarmer.warmAll.mockRejectedValue(initError);

      await expect(cacheInitializer.initialize()).rejects.toThrow('Initialization failed');
    });

    it('should handle warmAll returning zero results', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 0,
        success: 0,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed'),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should log initialization start', async () => {
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
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Failed'));

      await expect(cacheInitializer.initialize()).rejects.toThrow();

      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return true even when some cache operations fail', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });

  describe('idempotent initialization', () => {
    it('should not re-initialize if already initialized', async () => {
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

    it('should use same promise for concurrent calls', async () => {
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
  });
});