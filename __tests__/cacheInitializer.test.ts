import { cacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';

jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

describe('cacheInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cacheInitializer as unknown as { initialized: boolean; initPromise: Promise<void> | null }).initialized = false;
    (cacheInitializer as unknown as { initialized: boolean; initPromise: Promise<void> | null }).initPromise = null;
  });

  describe('initialize', () => {
    it('should initialize cache warming on first call', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValueOnce({
        success: 5,
        failed: 0,
        total: 5,
        results: []
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should return early if already initialized', async () => {
      (cacheInitializer as unknown as { initialized: boolean }).initialized = true;

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should return existing initPromise if initialization in progress', async () => {
      const mockPromise = Promise.resolve();
      (cacheInitializer as unknown as { initPromise: Promise<void> | null }).initPromise = mockPromise;

      const result = await cacheInitializer.initialize();

      expect(result).toBeUndefined();
      expect(cacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should handle cache warming with failures', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValueOnce({
        success: 4,
        failed: 1,
        total: 5,
        results: [{ key: 'test', error: 'failed' }]
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle cache warming with all failures', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValueOnce({
        success: 0,
        failed: 5,
        total: 5,
        results: []
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });

    it('should handle cache warming errors', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValueOnce(new Error('Cache error'));

      await expect(cacheInitializer.initialize()).rejects.toThrow('Cache error');

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', () => {
      (cacheInitializer as unknown as { initialized: boolean }).initialized = false;

      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should return true when initialized', () => {
      (cacheInitializer as unknown as { initialized: boolean }).initialized = true;

      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });
});