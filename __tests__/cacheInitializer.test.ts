import { cacheWarmer } from '@/lib/services/cacheWarmer';

jest.mock('@/lib/services/cacheWarmer');

describe('cacheInitializer', () => {
  let mockWarmAll: jest.Mock;
  let cacheInitializerModule: typeof import('@/lib/services/cacheInitializer');

  beforeEach(async () => {
    jest.clearAllMocks();
    mockWarmAll = cacheWarmer.warmAll as jest.Mock;
    cacheInitializerModule = await import('@/lib/services/cacheInitializer');
    cacheInitializerModule.cacheInitializer.reset();
  });

  describe('initialize', () => {
    it('should initialize cache warming successfully', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'success', latency: 50 },
          { name: 'tags', status: 'success', latency: 30 },
        ],
      });

      await cacheInitializerModule.cacheInitializer.initialize();

      expect(mockWarmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failure in cache warming', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success', latency: 30 },
        ],
      });

      const result = await cacheInitializerModule.cacheInitializer.initialize();
      expect(result).toBeUndefined();
    });

    it('should handle complete failure in cache warming', async () => {
      mockWarmAll.mockRejectedValue(new Error('Cache warming failed'));

      await expect(
        cacheInitializerModule.cacheInitializer.initialize()
      ).rejects.toThrow();
    });

    it('should return immediately if already initialized', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializerModule.cacheInitializer.initialize();
      await cacheInitializerModule.cacheInitializer.initialize();

      expect(mockWarmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent initialize calls', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      const promise1 = cacheInitializerModule.cacheInitializer.initialize();
      const promise2 = cacheInitializerModule.cacheInitializer.initialize();

      await Promise.all([promise1, promise2]);

      expect(mockWarmAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(cacheInitializerModule.cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializerModule.cacheInitializer.initialize();
      expect(cacheInitializerModule.cacheInitializer.isInitialized()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should allow re-initialization after reset', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializerModule.cacheInitializer.initialize();
      expect(cacheInitializerModule.cacheInitializer.isInitialized()).toBe(true);

      cacheInitializerModule.cacheInitializer.reset();
      expect(cacheInitializerModule.cacheInitializer.isInitialized()).toBe(false);

      await cacheInitializerModule.cacheInitializer.initialize();
      expect(mockWarmAll).toHaveBeenCalledTimes(2);
    });
  });
});