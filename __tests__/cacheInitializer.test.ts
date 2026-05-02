import { cacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

describe('cacheInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cacheInitializer state by accessing private state
    (cacheInitializer as unknown as { initialized: boolean; initPromise: Promise<void> | null }).initialized = false;
    (cacheInitializer as unknown as { initialized: boolean; initPromise: Promise<void> | null }).initPromise = null;
  });

  describe('initialize', () => {
    it('should successfully initialize cache', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 10,
        failed: 0,
        total: 10,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed'),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle initialization with some failures', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 8,
        failed: 2,
        total: 10,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed with failures'),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle initialization error', async () => {
      const error = new Error('Cache warming failed');
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(error);

      await expect(cacheInitializer.initialize()).rejects.toThrow('Cache warming failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        expect.objectContaining({ module: 'CacheInitializer' })
      );
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return early if already initialized', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 10,
        failed: 0,
        total: 10,
        results: [],
      });

      await cacheInitializer.initialize();
      await cacheInitializer.initialize(); // Second call should not call warmAll again

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent initialization calls', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 10,
        failed: 0,
        total: 10,
        results: [],
      });

      const promise1 = cacheInitializer.initialize();
      const promise2 = cacheInitializer.initialize();

      await Promise.all([promise1, promise2]);

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 10,
        failed: 0,
        total: 10,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should return false after failed initialization', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Failed'));

      await expect(cacheInitializer.initialize()).rejects.toThrow();

      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });
});
