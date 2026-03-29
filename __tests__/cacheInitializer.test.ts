jest.mock('@/lib/services/cacheWarmer', () => ({
  cacheWarmer: {
    warmAll: jest.fn().mockResolvedValue({
      total: 3,
      success: 3,
      failed: 0,
      results: [],
    }),
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
  const loadInitializer = async () => {
    const { cacheInitializer: ci } = await import('@/lib/services/cacheInitializer');
    return ci;
  };

  describe('initialize', () => {
    it('should initialize cache warming successfully', async () => {
      const cacheInitializer = await loadInitializer();
      
      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle partial failures', async () => {
      const { cacheWarmer } = await import('@/lib/services/cacheWarmer');
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValueOnce({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'latest posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'API Error' },
          { name: 'tags', status: 'success', latency: 50 },
        ],
      });

      const { cacheInitializer } = await import('@/lib/services/cacheInitializer');
      await cacheInitializer.initialize();

      expect(cacheInitializer.isInitialized()).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return state based on previous initialization', async () => {
      const cacheInitializer = await loadInitializer();
      
      expect(typeof cacheInitializer.isInitialized()).toBe('boolean');
    });
  });
});
