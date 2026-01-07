import { wordpressAPI } from '@/lib/wordpress'
import { apiClient, getApiUrl } from '@/lib/api/client'
import { cacheManager, CACHE_KEYS } from '@/lib/cache'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/api/client')
jest.mock('@/lib/cache')
jest.mock('@/lib/utils/logger')

// Unmock getApiUrl to use actual implementation
;(getApiUrl as jest.MockedFunction<typeof getApiUrl>).mockImplementation((path) => path)

// Mock CACHE_KEYS.media to return correct cache keys
;(CACHE_KEYS.media as jest.Mock).mockImplementation((id: number) => `media_${id}`)
;(CACHE_KEYS.search as jest.Mock).mockImplementation((query: string) => `search_${query}`)

describe('WordPress API - Batch Operations and Caching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPostsWithHeaders', () => {
    it('returns posts with total from x-wp-total header', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'Post 1' } },
        { id: 2, title: { rendered: 'Post 2' } }
      ]

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: {
          'x-wp-total': '150',
          'x-wp-totalpages': '15'
        }
      })

      const result = await wordpressAPI.getPostsWithHeaders({ page: 1, per_page: 10 })

      expect(result.data).toEqual(mockPosts)
      expect(result.total).toBe(150)
      expect(result.totalPages).toBe(15)
      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/posts'),
        { params: { page: 1, per_page: 10 }, signal: undefined }
      )
    })

    it('defaults to 0 for total when header is missing', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post 1' } }]

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: {}
      })

      const result = await wordpressAPI.getPostsWithHeaders()

      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(1)
    })

    it('supports optional signal parameter', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post 1' } }]
      const mockSignal = {} as AbortSignal

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: { 'x-wp-total': '10', 'x-wp-totalpages': '1' }
      })

      await wordpressAPI.getPostsWithHeaders({ page: 1 }, mockSignal)

      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/posts'),
        { params: { page: 1 }, signal: mockSignal }
      )
    })

    it('handles category filter', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Category Post' } }]

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: { 'x-wp-total': '5', 'x-wp-totalpages': '1' }
      })

      await wordpressAPI.getPostsWithHeaders({ category: 123 })

      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/posts'),
        { params: { category: 123 }, signal: undefined }
      )
    })

    it('handles tag filter', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Tag Post' } }]

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: { 'x-wp-total': '3', 'x-wp-totalpages': '1' }
      })

      await wordpressAPI.getPostsWithHeaders({ tag: 456 })

      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/posts'),
        { params: { tag: 456 }, signal: undefined }
      )
    })

    it('handles search query', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Search Result' } }]

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' }
      })

      await wordpressAPI.getPostsWithHeaders({ search: 'test' })

      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/posts'),
        { params: { search: 'test' }, signal: undefined }
      )
    })
  })

  describe('getMediaBatch', () => {
    it('fetches multiple media items in single request', async () => {
      const mockMedia = [
        { id: 1, source_url: 'https://example.com/image1.jpg' },
        { id: 2, source_url: 'https://example.com/image2.jpg' },
        { id: 3, source_url: 'https://example.com/image3.jpg' }
      ]

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaBatch([1, 2, 3])

      expect(result.size).toBe(3)
      expect(result.get(1)).toEqual(mockMedia[0])
      expect(result.get(2)).toEqual(mockMedia[1])
      expect(result.get(3)).toEqual(mockMedia[2])
      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/media'),
        { params: { include: '1,2,3' }, signal: undefined }
      )
    })

    it('returns cached media items without fetching', async () => {
      const cachedMedia = { id: 1, source_url: 'https://example.com/image1.jpg' }

      ;(cacheManager.get as jest.Mock).mockReturnValue(cachedMedia)
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [] })

      const result = await wordpressAPI.getMediaBatch([1])

      expect(result.size).toBe(1)
      expect(result.get(1)).toEqual(cachedMedia)
      expect(cacheManager.get).toHaveBeenCalledWith('media_1')
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('skips media ID 0', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [] })

      const result = await wordpressAPI.getMediaBatch([0])

      expect(result.size).toBe(0)
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('skips media ID 0 with cached item', async () => {
      const cachedMedia = { id: 1, source_url: 'https://example.com/image1.jpg' }

      ;(cacheManager.get as jest.Mock).mockReturnValue(cachedMedia)
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [] })

      const result = await wordpressAPI.getMediaBatch([0, 1])

      expect(result.size).toBe(1)
      expect(result.get(1)).toEqual(cachedMedia)
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('mixes cached and fetched media items', async () => {
      const cachedMedia = { id: 1, source_url: 'https://example.com/image1.jpg' }
      const mockMedia = [{ id: 2, source_url: 'https://example.com/image2.jpg' }]

      ;(cacheManager.get as jest.Mock)
        .mockReturnValueOnce(cachedMedia)
        .mockReturnValueOnce(null)

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaBatch([1, 2])

      expect(result.size).toBe(2)
      expect(result.get(1)).toEqual(cachedMedia)
      expect(result.get(2)).toEqual(mockMedia[0])
      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/media'),
        { params: { include: '2' }, signal: undefined }
      )
    })

    it('caches newly fetched media items', async () => {
      const mockMedia = [{ id: 1, source_url: 'https://example.com/image1.jpg' }]

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      await wordpressAPI.getMediaBatch([1])

      expect(cacheManager.set).toHaveBeenCalledWith('media_1', mockMedia[0], expect.any(Number))
    })

    it('handles API errors gracefully and returns empty result', async () => {
      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await wordpressAPI.getMediaBatch([1, 2, 3])

      expect(result.size).toBe(0)
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to fetch media batch',
        expect.any(Error),
        { module: 'wordpressAPI' }
      )
    })

    it('supports optional signal parameter', async () => {
      const mockMedia = [{ id: 1, source_url: 'https://example.com/image1.jpg' }]
      const mockSignal = {} as AbortSignal

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      await wordpressAPI.getMediaBatch([1], mockSignal)

      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/media'),
        { params: { include: '1' }, signal: mockSignal }
      )
    })

    it('handles empty media array', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: []
      })

      const result = await wordpressAPI.getMediaBatch([])

      expect(result.size).toBe(0)
      expect(apiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('getMediaUrl', () => {
    it('returns null for media ID 0', async () => {
      const result = await wordpressAPI.getMediaUrl(0)

      expect(result).toBeNull()
      expect(cacheManager.get).not.toHaveBeenCalled()
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('returns cached media URL', async () => {
      const cachedUrl = 'https://example.com/image.jpg'

      ;(cacheManager.get as jest.Mock).mockReturnValue(cachedUrl)

      const result = await wordpressAPI.getMediaUrl(1)

      expect(result).toBe(cachedUrl)
      expect(cacheManager.get).toHaveBeenCalledWith('media_1')
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('fetches and caches media URL', async () => {
      const mockMedia = { id: 1, source_url: 'https://example.com/image.jpg' }

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaUrl(1)

      expect(result).toBe('https://example.com/image.jpg')
      expect(apiClient.get).toHaveBeenCalledWith(getApiUrl('/wp/v2/media/1'), { signal: undefined })
      expect(cacheManager.set).toHaveBeenCalled()
    })


    it('returns null when media has no source_url', async () => {
      const mockMedia = { id: 1, source_url: null }

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaUrl(1)

      expect(result).toBeNull()
      expect(cacheManager.set).not.toHaveBeenCalled()
    })

    it('handles API errors and returns null', async () => {
      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('Media not found'))

      const result = await wordpressAPI.getMediaUrl(1)

      expect(result).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to fetch media 1',
        expect.any(Error),
        { module: 'wordpressAPI' }
      )
    })

    it('supports optional signal parameter', async () => {
      const mockMedia = { id: 1, source_url: 'https://example.com/image.jpg' }
      const mockSignal = {} as AbortSignal

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      await wordpressAPI.getMediaUrl(1, mockSignal)

      expect(apiClient.get).toHaveBeenCalledWith(getApiUrl('/wp/v2/media/1'), { signal: mockSignal })
    })
  })

  describe('getMediaUrlsBatch', () => {
    it('returns map of media IDs to URLs', async () => {
      const mockMedia = [
        { id: 1, source_url: 'https://example.com/image1.jpg' },
        { id: 2, source_url: 'https://example.com/image2.jpg' }
      ]

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaUrlsBatch([1, 2])

      expect(result.size).toBe(2)
      expect(result.get(1)).toBe('https://example.com/image1.jpg')
      expect(result.get(2)).toBe('https://example.com/image2.jpg')
    })

    it('returns null for media ID 0', async () => {
      const result = await wordpressAPI.getMediaUrlsBatch([0])

      expect(result.size).toBe(1)
      expect(result.get(0)).toBeNull()
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('returns null for media ID 0 with valid IDs', async () => {
      const mockMedia = [{ id: 1, source_url: 'https://example.com/image1.jpg' }]

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaUrlsBatch([0, 1])

      expect(result.size).toBe(2)
      expect(result.get(0)).toBeNull()
      expect(result.get(1)).toBe('https://example.com/image1.jpg')
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('handles missing media items', async () => {
      const mockMedia = [{ id: 1, source_url: 'https://example.com/image1.jpg' }]

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      const result = await wordpressAPI.getMediaUrlsBatch([1, 2, 3])

      expect(result.size).toBe(3)
      expect(result.get(1)).toBe('https://example.com/image1.jpg')
      expect(result.get(2)).toBeNull()
      expect(result.get(3)).toBeNull()
    })

    it('supports optional signal parameter', async () => {
      const mockMedia = [{ id: 1, source_url: 'https://example.com/image1.jpg' }]
      const mockSignal = {} as AbortSignal

      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(apiClient.get as jest.Mock).mockResolvedValue({
        data: mockMedia
      })

      await wordpressAPI.getMediaUrlsBatch([1], mockSignal)

      expect(apiClient.get).toHaveBeenCalledWith(
        getApiUrl('/wp/v2/media'),
        { params: { include: '1' }, signal: mockSignal }
      )
    })

    it('handles empty media IDs array', async () => {
      const result = await wordpressAPI.getMediaUrlsBatch([])

      expect(result.size).toBe(0)
      expect(apiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('clearCache', () => {
    it('clears all cache when no pattern provided', () => {
      wordpressAPI.clearCache()

      expect(cacheManager.clear).toHaveBeenCalled()
      expect(cacheManager.clearPattern).not.toHaveBeenCalled()
    })

    it('clears cache with pattern when pattern provided', () => {
      const pattern = 'media_*'

      wordpressAPI.clearCache(pattern)

      expect(cacheManager.clear).not.toHaveBeenCalled()
      expect(cacheManager.clearPattern).toHaveBeenCalledWith(pattern)
    })
  })

  describe('getCacheStats', () => {
    it('returns cache statistics', () => {
      const mockStats = {
        size: 10,
        hitRate: 0.8,
        hits: 80,
        misses: 20
      }

      ;(cacheManager.getStats as jest.Mock).mockReturnValue(mockStats)

      const result = wordpressAPI.getCacheStats()

      expect(result).toEqual(mockStats)
      expect(cacheManager.getStats).toHaveBeenCalled()
    })
  })

  describe('warmCache', () => {
    it('warms cache with posts, categories, and tags', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post 1' } }]
      const mockCategories = [{ id: 1, name: 'Category 1' }]
      const mockTags = [{ id: 1, name: 'Tag 1' }]

      ;(apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockPosts })
        .mockResolvedValueOnce({ data: mockCategories })
        .mockResolvedValueOnce({ data: mockTags })

      await wordpressAPI.warmCache()

      expect(apiClient.get).toHaveBeenCalledWith(getApiUrl('/wp/v2/posts'), { params: { per_page: 6 }, signal: undefined })
      expect(apiClient.get).toHaveBeenCalledWith(getApiUrl('/wp/v2/categories'), { signal: undefined })
      expect(apiClient.get).toHaveBeenCalledWith(getApiUrl('/wp/v2/tags'), { signal: undefined })
      expect(logger.warn).toHaveBeenCalledWith('Cache warming completed', undefined, { module: 'wordpressAPI' })
    })

    it('handles errors during cache warming', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('API error'))

      await wordpressAPI.warmCache()

      expect(logger.warn).toHaveBeenCalledWith(
        'Cache warming failed',
        expect.any(Error),
        { module: 'wordpressAPI' }
      )
    })

    it('continues warming cache if one endpoint fails', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post 1' } }]
      const mockTags = [{ id: 1, name: 'Tag 1' }]

      ;(apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockPosts })
        .mockRejectedValueOnce(new Error('Categories error'))
        .mockResolvedValueOnce({ data: mockTags })

      await wordpressAPI.warmCache()

      expect(apiClient.get).toHaveBeenCalledTimes(3)
      expect(logger.warn).toHaveBeenCalledWith('Cache warming failed', expect.any(Error), { module: 'wordpressAPI' })
    })
  })
})
