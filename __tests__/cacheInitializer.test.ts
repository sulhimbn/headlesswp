import { CacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

describe('CacheInitializer', () => {
  let cacheInitializer: CacheInitializer;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheInitializer = new CacheInitializer();
  });

  describe('initialize', () => {
    it('should successfully initialize cache warming', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'success', latency: 50 },
          { name: 'tags', status: 'success', latency: 75 }
        ]
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should log warning when there are failures', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success', latency: 75 }
        ]
      });

      await cacheInitializer.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should not reinitialize if already initialized', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      });

      await cacheInitializer.initialize();
      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should return existing promise if initialization is in progress', async () => {
      let resolvePromise: (value: { total: number; success: number; failed: number; results: unknown[] }) => void;
      
      (cacheWarmer.warmAll as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      });

      const promise1 = cacheInitializer.initialize();
      const promise2 = cacheInitializer.initialize();

      resolvePromise!({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      });

      await Promise.all([promise1, promise2]);

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should throw error and reset state on failure', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Initialization failed'));

      await expect(cacheInitializer.initialize()).rejects.toThrow('Initialization failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        expect.any(Error),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should set initialized to false on failure', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Initialization failed'));

      try {
        await cacheInitializer.initialize();
      } catch (e) {
        // Expected
      }

      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should allow retry after failure', async () => {
      (cacheWarmer.warmAll as jest.Mock)
        .mockRejectedValueOnce(new Error('Initialization failed'))
        .mockResolvedValueOnce({
          total: 3,
          success: 3,
          failed: 0,
          results: []
        });

      try {
        await cacheInitializer.initialize();
      } catch (e) {
        // Expected first call to fail
      }

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      });

      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should return false after failed initialization', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Failed'));

      try {
        await cacheInitializer.initialize();
      } catch (e) {
        // Expected
      }

      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });
});
