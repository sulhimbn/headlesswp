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
    it('should initialize cache warming successfully', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 5,
        failed: 0,
        total: 5,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalled();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle partial failures', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 3,
        failed: 2,
        total: 5,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).toHaveBeenCalled();
      expect(cacheInitializer.isInitialized()).toBe(true);
    });

    it('should handle initialization failure', async () => {
      (cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Initialization failed'));

      await expect(cacheInitializer.initialize()).rejects.toThrow('Initialization failed');
      expect(cacheInitializer.isInitialized()).toBe(false);
    });

    it('should not reinitialize if already initialized', async () => {
      (cacheInitializer as unknown as { initialized: boolean }).initialized = true;
      (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 5,
        failed: 0,
        total: 5,
        results: [],
      });

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).not.toHaveBeenCalled();
    });

    it('should not call warmAll if already initialized', async () => {
      (cacheInitializer as unknown as { initialized: boolean }).initialized = true;

      await cacheInitializer.initialize();

      expect(cacheWarmer.warmAll).not.toHaveBeenCalled();
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
