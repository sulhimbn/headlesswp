import { cacheInitializer } from '@/lib/services/cacheInitializer';

jest.mock('@/lib/services/cacheWarmer', () => ({
  cacheWarmer: {
    warmAll: jest.fn()
  }
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';

describe('cacheInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cacheInitializer as any).initialized = false;
    (cacheInitializer as any).initPromise = null;
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      });

      await cacheInitializer.initialize();

      expect(logger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      );
      expect(cacheWarmer.warmAll).toHaveBeenCalled();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      (cacheInitializer as any).initialized = true;

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should return existing initPromise if initialization in progress', async () => {
      const mockPromise = Promise.resolve();
      (cacheInitializer as any).initPromise = mockPromise;

      const result = await cacheInitializer.initialize();

      expect(result).toBeUndefined();
      expect(cacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should handle partial failure', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'error' },
          { name: 'tags', status: 'success', latency: 50 }
        ]
      });

      await cacheInitializer.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed with failures'),
        expect.objectContaining({ module: 'CacheInitializer' })
      );
    });

    it('should handle initialization failure', async () => {
      const error = new Error('Initialization failed');
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(error);

      await expect(cacheInitializer.initialize()).rejects.toThrow('Initialization failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      );
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should reset initPromise on failure', async () => {
      const error = new Error('Initialization failed');
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(error);

      try {
        await cacheInitializer.initialize();
      } catch (e) {
      }

      expect((cacheInitializer as any).initPromise).toBeNull();
    });
  });

  describe('isInitialized', () => {
    it('should return true when initialized', () => {
      (cacheInitializer as any).initialized = true;

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should return false when not initialized', () => {
      (cacheInitializer as any).initialized = false;

      expect(cacheInitializer.isInitialized()).toBe(false);
    });
  });
});
