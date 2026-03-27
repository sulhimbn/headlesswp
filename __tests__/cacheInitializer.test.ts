jest.mock('@/lib/services/cacheWarmer');
jest.mock('@/lib/utils/logger');

import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { cacheInitializer } from '@/lib/services/cacheInitializer';

describe('CacheInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should invoke cacheWarmer.warmAll', async () => {
    (cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
      total: 3,
      success: 3,
      failed: 0,
      results: [],
    });

    await cacheInitializer.initialize();

    expect(cacheWarmer.warmAll).toHaveBeenCalled();
  });
});
