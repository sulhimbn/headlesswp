import { GET as CacheGET, POST as CachePOST, DELETE as CacheDELETE } from '@/app/api/cache/route'
import { getCacheStats, clearCache, exportCacheData, importCacheData } from '@/lib/cache'
import { cacheWarmer } from '@/lib/services/cacheWarmer'
import { logger } from '@/lib/utils/logger'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

const mockRequest = {
  url: 'http://localhost:3000/api/cache',
  headers: new Map()
} as any

jest.mock('@/lib/cache')
jest.mock('@/lib/services/cacheWarmer')
jest.mock('@/lib/utils/logger')
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => {
      const headersMap: Record<string, string> = { ...(init?.headers || {}) }
      return {
        status: init?.status || 200,
        json: () => Promise.resolve(body),
        headers: {
          get: (key: string) => headersMap[key] || null,
          set: (key: string, value: string) => {
            headersMap[key] = value
          }
        }
      }
    })
  }
}))

const { getCacheStats: mockGetCacheStats, clearCache: mockClearCache, exportCacheData: mockExportCacheData, importCacheData: mockImportCacheData } = require('@/lib/cache')
const { cacheWarmer: mockCacheWarmer } = require('@/lib/services/cacheWarmer')
const { logger: mockLogger } = require('@/lib/utils/logger')

describe('Cache API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  describe('GET /api/cache', () => {
    it('should return 200 with cache statistics', async () => {
      const mockStats = {
        hits: 100,
        misses: 20,
        hitRate: 83.33,
        total: 120,
        size: 50,
        memoryUsageBytes: 1024000,
        cascadeInvalidations: 5,
        dependencyRegistrations: 10,
        avgTtl: 1800000
      }
      mockGetCacheStats.mockReturnValue(mockStats)

      const response = await CacheGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockStats)
      expect(data.timestamp).toBeDefined()
      expect(mockGetCacheStats).toHaveBeenCalled()
    })

    it('should return 500 when fetching cache stats fails', async () => {
      mockGetCacheStats.mockImplementation(() => {
        throw new Error('Cache stats error')
      })

      const response = await CacheGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch cache statistics')
      expect(data.timestamp).toBeDefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching cache stats:',
        expect.any(Error),
        { module: 'cache' }
      )
    })

    it('should handle empty cache stats', async () => {
      const mockStats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        total: 0,
        size: 0,
        memoryUsageBytes: 0,
        cascadeInvalidations: 0,
        dependencyRegistrations: 0,
        avgTtl: 0
      }
      mockGetCacheStats.mockReturnValue(mockStats)

      const response = await CacheGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockStats)
      expect(data.data.hits).toBe(0)
      expect(data.data.total).toBe(0)
    })
  })

  describe('POST /api/cache', () => {
    it('should return 200 when cache warming completes successfully', async () => {
      const mockWarmResult = {
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'latest posts', status: 'success', latency: 150 },
          { name: 'categories', status: 'success', latency: 80 },
          { name: 'tags', status: 'success', latency: 60 }
        ]
      }
      mockCacheWarmer.warmAll.mockResolvedValue(mockWarmResult)

      const response = await CachePOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Cache warming completed')
      expect(data.data).toEqual(mockWarmResult)
      expect(data.timestamp).toBeDefined()
      expect(mockCacheWarmer.warmAll).toHaveBeenCalled()
    })

    it('should return 500 when cache warming fails', async () => {
      mockCacheWarmer.warmAll.mockRejectedValue(new Error('Warming failed'))

      const response = await CachePOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to warm cache')
      expect(data.timestamp).toBeDefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error warming cache:',
        expect.any(Error),
        { module: 'cache' }
      )
    })

    it('should handle partial cache warming failures', async () => {
      const mockWarmResult = {
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'latest posts', status: 'success', latency: 150 },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success', latency: 60 }
        ]
      }
      mockCacheWarmer.warmAll.mockResolvedValue(mockWarmResult)

      const response = await CachePOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Cache warming completed')
      expect(data.data.total).toBe(3)
      expect(data.data.success).toBe(2)
      expect(data.data.failed).toBe(1)
    })
  })

  describe('DELETE /api/cache', () => {
    it('should return 200 when all cache is cleared', async () => {
      mockClearCache.mockReturnValue(10)

      const response = await CacheDELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('All cache cleared')
      expect(data.timestamp).toBeDefined()
      expect(mockClearCache).toHaveBeenCalledWith(undefined)
    })

    it('should return 200 when cache is cleared by pattern', async () => {
      const requestWithPattern = {
        url: 'http://localhost:3000/api/cache?pattern=post:'
      } as any
      mockClearCache.mockReturnValue(5)

      const response = await CacheDELETE(requestWithPattern)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Cache cleared for pattern: post:')
      expect(data.timestamp).toBeDefined()
      expect(mockClearCache).toHaveBeenCalledWith('post:')
    })

    it('should return 200 when pattern is empty string', async () => {
      const requestWithEmptyPattern = {
        url: 'http://localhost:3000/api/cache?pattern='
      } as any
      mockClearCache.mockReturnValue(0)

      const response = await CacheDELETE(requestWithEmptyPattern)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('All cache cleared')
      expect(mockClearCache).toHaveBeenCalledWith(undefined)
    })

    it('should return 500 when cache clearing fails', async () => {
      mockClearCache.mockImplementation(() => {
        throw new Error('Clear cache error')
      })

      const response = await CacheDELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to clear cache')
      expect(data.timestamp).toBeDefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error clearing cache:',
        expect.anything(),
        { module: 'cache' }
      )
    })

    it('should return 200 when no entries match pattern', async () => {
      const requestWithPattern = {
        url: 'http://localhost:3000/api/cache?pattern=nonexistent:'
      } as any
      mockClearCache.mockReturnValue(0)

      const response = await CacheDELETE(requestWithPattern)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Cache cleared for pattern: nonexistent:')
    })

    it('should return 200 when multiple entries match pattern', async () => {
      const requestWithPattern = {
        url: 'http://localhost:3000/api/cache?pattern=post:'
      } as any
      mockClearCache.mockReturnValue(25)

      const response = await CacheDELETE(requestWithPattern)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Cache cleared for pattern: post:')
      expect(mockClearCache).toHaveBeenCalledWith('post:')
    })
  })

  describe('GET /api/cache?action=export', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      process.env = { ...originalEnv, CACHE_SECRET: 'test-secret' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return 401 when CACHE_SECRET is not configured', async () => {
      process.env.CACHE_SECRET = undefined;
      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=export',
        headers: { get: () => 'test-secret' }
      } as any;

      const response = await CacheGET(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized - CACHE_SECRET required');
    });

    it('should return 401 when secret header is missing', async () => {
      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=export',
        headers: { get: () => null }
      } as any;

      const response = await CacheGET(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - CACHE_SECRET required');
    });

    it('should return 401 when secret header is incorrect', async () => {
      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=export',
        headers: { get: () => 'wrong-secret' }
      } as any;

      const response = await CacheGET(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - CACHE_SECRET required');
    });

    it('should export cache when secret is correct', async () => {
      const mockExportData = {
        version: '1.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          { key: 'post:1', data: { id: 1 }, timestamp: 1234567890, ttl: 60000, dependencies: [], dependents: [] }
        ]
      };
      mockExportCacheData.mockReturnValue(mockExportData);

      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=export',
        headers: { get: () => 'test-secret' }
      } as any;

      const response = await CacheGET(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockExportData);
      expect(mockExportCacheData).toHaveBeenCalled();
    });

    it('should return 500 when export fails', async () => {
      mockExportCacheData.mockImplementation(() => {
        throw new Error('Export failed');
      });

      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=export',
        headers: { get: () => 'test-secret' }
      } as any;

      const response = await CacheGET(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to export cache');
    });
  })

  describe('POST /api/cache?action=import', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      process.env = { ...originalEnv, CACHE_SECRET: 'test-secret' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return 401 when CACHE_SECRET is not configured', async () => {
      process.env.CACHE_SECRET = undefined;
      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => 'test-secret' },
        json: () => Promise.resolve({ data: {} })
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 401 when secret header is missing', async () => {
      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => null },
        json: () => Promise.resolve({ data: {} })
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it('should return 400 when request body is missing data', async () => {
      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => 'test-secret' },
        json: () => Promise.resolve({})
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing cache data in request body');
    });

    it('should return 400 when import data is invalid', async () => {
      mockImportCacheData.mockReturnValue({ success: false, imported: 0, error: 'Invalid cache data format' });

      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => 'test-secret' },
        json: () => Promise.resolve({ data: { entries: 'invalid' } })
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should import cache when data is valid', async () => {
      mockImportCacheData.mockReturnValue({ success: true, imported: 5 });

      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => 'test-secret' },
        json: () => Promise.resolve({ data: { version: '1.0', entries: [] } })
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.imported).toBe(5);
      expect(mockImportCacheData).toHaveBeenCalledWith({ version: '1.0', entries: [] }, true);
    });

    it('should import cache with merge=false', async () => {
      mockImportCacheData.mockReturnValue({ success: true, imported: 3 });

      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => 'test-secret' },
        json: () => Promise.resolve({ data: { version: '1.0', entries: [] }, merge: false })
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockImportCacheData).toHaveBeenCalledWith({ version: '1.0', entries: [] }, false);
    });

    it('should return 400 when import throws an error', async () => {
      mockImportCacheData.mockImplementation(() => {
        throw new Error('Import error');
      });

      const reqWithHeaders = {
        url: 'http://localhost:3000/api/cache?action=import',
        headers: { get: () => 'test-secret' },
        json: () => Promise.resolve({ data: {} })
      } as any;

      const response = await CachePOST(reqWithHeaders);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  })
})
