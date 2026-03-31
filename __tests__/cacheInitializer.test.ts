import { cacheInitializer } from '@/lib/services/cacheInitializer';
import { cacheWarmer } from '@/lib/services/cacheWarmer';

jest.mock('@/lib/services/cacheWarmer');

describe('cacheInitializer', () => {
  let mockWarmAll: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWarmAll = cacheWarmer.warmAll as jest.Mock;
    cacheInitializer.reset();
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

      await cacheInitializer.initialize();

      expect(mockWarmAll).toHaveBeenCalled();
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

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should set initialized flag on success', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return true after successful initialization', async () => {
      mockWarmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      });

      await cacheInitializer.initialize();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });
});
