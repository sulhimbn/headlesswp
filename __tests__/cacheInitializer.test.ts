const mockWarmAll = jest.fn();
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('@/lib/services/cacheWarmer', () => ({
  cacheWarmer: {
    warmAll: (...args: unknown[]) => mockWarmAll(...args),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: mockLogger,
}));

import { CacheInitializer } from '@/lib/services/cacheInitializer';

describe('CacheInitializer', () => {
  let cacheInitializer: CacheInitializer;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheInitializer = new CacheInitializer();
    mockWarmAll.mockResolvedValue({
      success: 5,
      failed: 0,
      total: 5,
      results: [],
    });
  });

  describe('initialize', () => {
    it('should call cacheWarmer.warmAll', async () => {
      await cacheInitializer.initialize();
      expect(mockWarmAll).toHaveBeenCalledTimes(1);
    });

    it('should log info on successful initialization', async () => {
      await cacheInitializer.initialize();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log warning when there are failures', async () => {
      mockWarmAll.mockResolvedValue({
        success: 4,
        failed: 1,
        total: 5,
        results: [{ name: 'categories', status: 'failed', error: 'Network error' }],
      });

      await cacheInitializer.initialize();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/5',
        expect.any(Object)
      );
    });

    it('should not call warmAll again if already initialized', async () => {
      await cacheInitializer.initialize();
      await cacheInitializer.initialize();
      expect(mockWarmAll).toHaveBeenCalledTimes(1);
    });

    it('should throw error when warmAll fails', async () => {
      mockWarmAll.mockRejectedValue(new Error('Network failure'));

      await expect(cacheInitializer.initialize()).rejects.toThrow('Network failure');
    });

    it('should log error on failure', async () => {
      mockWarmAll.mockRejectedValue(new Error('Network failure'));

      try {
        await cacheInitializer.initialize();
      } catch (e) {
        // Expected
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle concurrent calls', async () => {
      mockWarmAll.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: 5,
          failed: 0,
          total: 5,
          results: [],
        }), 50))
      );

      const [result1, result2] = await Promise.all([
        cacheInitializer.initialize(),
        cacheInitializer.initialize(),
      ]);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(mockWarmAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('isInitialized', () => {
    it('should return false initially', () => {
      const freshInitializer = new CacheInitializer();
      expect(freshInitializer.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });
});