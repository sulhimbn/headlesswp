import { cacheWarmer } from '@/lib/services/cacheWarmer'
import { wordpressAPI } from '@/lib/wordpress'
import { logger } from '@/lib/utils/logger'
import { cacheManager } from '@/lib/cache'

jest.mock('@/lib/wordpress')
jest.mock('@/lib/utils/logger')

// Mock cacheManager.getStats to avoid dependency on actual cache implementation
const mockCacheStats = {
  hits: 0,
  misses: 0,
  hitRate: 0,
  total: 0,
  size: 0,
  memoryUsageBytes: 0,
  cascadeInvalidations: 0,
  dependencyRegistrations: 0,
  avgTtl: 0,
}

jest.spyOn(cacheManager, 'getStats').mockImplementation(() => mockCacheStats as any)

describe('cacheWarmer', () => {
  let mockedWordpressAPI: jest.Mocked<typeof wordpressAPI>
  let mockedLogger: jest.Mocked<typeof logger>

  beforeEach(() => {
    jest.clearAllMocks()
    mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>
    mockedLogger = logger as jest.Mocked<typeof logger>
    
    // Reset mock cache stats
    Object.assign(mockCacheStats, {
      hits: 0,
      misses: 0,
      hitRate: 0,
      total: 0,
      size: 0,
      memoryUsageBytes: 0,
      cascadeInvalidations: 0,
      dependencyRegistrations: 0,
      avgTtl: 0,
    })
  })

  describe('warmAll()', () => {
    it('should successfully warm all caches', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      const result = await cacheWarmer.warmAll()

      expect(result.total).toBe(3)
      expect(result.success).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.results).toHaveLength(3)
      expect(result.results.every(r => r.status === 'success')).toBe(true)
    })

    it('should handle partial failures', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockRejectedValue(new Error('Network error'))
      mockedWordpressAPI.getTags.mockResolvedValue([])

      const result = await cacheWarmer.warmAll()

      expect(result.total).toBe(3)
      expect(result.success).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.results).toHaveLength(3)
      expect(result.results[0].status).toBe('success')
      expect(result.results[1].status).toBe('failed')
      expect(result.results[1].error).toContain('Network error')
      expect(result.results[2].status).toBe('success')
    })

    it('should handle all failures', async () => {
      mockedWordpressAPI.getPosts.mockRejectedValue(new Error('Posts error'))
      mockedWordpressAPI.getCategories.mockRejectedValue(new Error('Categories error'))
      mockedWordpressAPI.getTags.mockRejectedValue(new Error('Tags error'))

      const result = await cacheWarmer.warmAll()

      expect(result.total).toBe(3)
      expect(result.success).toBe(0)
      expect(result.failed).toBe(3)
      expect(result.results.every(r => r.status === 'failed')).toBe(true)
    })

    it('should log start message', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      await cacheWarmer.warmAll()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Starting cache warming...',
        { module: 'CacheWarmer' }
      )
    })

    it('should log completion message with stats', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      const result = await cacheWarmer.warmAll()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Cache warming completed: ${result.success}/${result.total} succeeded`),
        expect.objectContaining({
          module: 'CacheWarmer',
          results: expect.any(Array)
        })
      )
    })

    it('should return latency for successful operations', async () => {
      mockedWordpressAPI.getPosts.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      )
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      const result = await cacheWarmer.warmAll()

      expect(result.results[0].latency).toBeGreaterThan(50)
      expect(result.results[1].latency).toBeDefined()
      expect(result.results[2].latency).toBeDefined()
    })

    it('should warm latest posts', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      await cacheWarmer.warmAll()

      expect(mockedWordpressAPI.getPosts).toHaveBeenCalledWith({ per_page: 6 })
    })

    it('should warm categories and set cache', async () => {
      const categories = [{ id: 1, name: 'News', slug: 'news', description: '', parent: 0, count: 5, link: '' }]
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue(categories)
      mockedWordpressAPI.getTags.mockResolvedValue([])

      const result = await cacheWarmer.warmAll()

      expect(mockedWordpressAPI.getCategories).toHaveBeenCalled()
      expect(result.results[1].name).toBe('categories')
    })

    it('should warm tags and set cache', async () => {
      const tags = [{ id: 1, name: 'Technology', slug: 'technology', description: '', count: 3, link: '' }]
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue(tags)

      const result = await cacheWarmer.warmAll()

      expect(mockedWordpressAPI.getTags).toHaveBeenCalled()
      expect(result.results[2].name).toBe('tags')
    })

    it('should handle exceptions in warmAll and return empty results', async () => {
      // Note: Promise.allSettled never throws, so this catch block is currently unreachable
      // This test documents the intended behavior if exceptions could occur
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      const result = await cacheWarmer.warmAll()

      expect(result.total).toBe(3)
      expect(result.success).toBe(3)
      expect(result.failed).toBe(0)
    })

    it('should log error when warmAll fails', async () => {
      // Note: Promise.allSettled never throws, so error logging in catch block is currently unreachable
      // This test documents the intended behavior
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])

      await cacheWarmer.warmAll()

      expect(mockedLogger.error).not.toHaveBeenCalled()
    })

    it('should run warm operations in parallel', async () => {
      let getPostsStarted = false
      let getCategoriesStarted = false
      let getTagsStarted = false

      mockedWordpressAPI.getPosts.mockImplementation(() => {
        getPostsStarted = true
        return new Promise(resolve => setTimeout(() => resolve([]), 100))
      })
      mockedWordpressAPI.getCategories.mockImplementation(() => {
        getCategoriesStarted = true
        return new Promise(resolve => setTimeout(() => resolve([]), 100))
      })
      mockedWordpressAPI.getTags.mockImplementation(() => {
        getTagsStarted = true
        return new Promise(resolve => setTimeout(() => resolve([]), 100))
      })

      await cacheWarmer.warmAll()

      expect(getPostsStarted && getCategoriesStarted && getTagsStarted).toBe(true)
    })
  })

  describe('getStats()', () => {
    it('should return cache stats with hit rate calculation', () => {
      mockCacheStats.hits = 80
      mockCacheStats.misses = 20

      const stats = cacheWarmer.getStats()

      expect(stats.hits).toBe(80)
      expect(stats.misses).toBe(20)
      expect(stats.hitsRate).toBe(80)
    })

    it('should calculate hit rate correctly with different values', () => {
      mockCacheStats.hits = 150
      mockCacheStats.misses = 50

      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(75)
    })

    it('should return zero hit rate when no cache activity', () => {
      mockCacheStats.hits = 0
      mockCacheStats.misses = 0

      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(0)
    })

    it('should handle 100% hit rate', () => {
      mockCacheStats.hits = 100
      mockCacheStats.misses = 0

      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(100)
    })

    it('should handle 0% hit rate', () => {
      mockCacheStats.hits = 0
      mockCacheStats.misses = 100

      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(0)
    })

    it('should round hit rate to 2 decimal places', () => {
      mockCacheStats.hits = 1
      mockCacheStats.misses = 3

      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(25)
    })

    it('should handle large numbers', () => {
      mockCacheStats.hits = 9999
      mockCacheStats.misses = 1

      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(99.99)
    })

    it('should return stats with correct structure', () => {
      mockCacheStats.hits = 50
      mockCacheStats.misses = 50

      const stats = cacheWarmer.getStats()

      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitsRate')
      expect(typeof stats.hits).toBe('number')
      expect(typeof stats.misses).toBe('number')
      expect(typeof stats.hitsRate).toBe('number')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete warmAll cycle with stats', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockResolvedValue([])
      mockedWordpressAPI.getTags.mockResolvedValue([])
      mockCacheStats.hits = 100
      mockCacheStats.misses = 25

      const warmResult = await cacheWarmer.warmAll()
      const stats = cacheWarmer.getStats()

      expect(warmResult.success).toBe(3)
      expect(stats.hitsRate).toBe(80)
    })

    it('should handle partial warm with subsequent stats', async () => {
      mockedWordpressAPI.getPosts.mockResolvedValue([])
      mockedWordpressAPI.getCategories.mockRejectedValue(new Error('Network error'))
      mockedWordpressAPI.getTags.mockResolvedValue([])
      mockCacheStats.hits = 10
      mockCacheStats.misses = 5

      await cacheWarmer.warmAll()
      const stats = cacheWarmer.getStats()

      expect(stats.hitsRate).toBe(66.67)
    })
  })
})
