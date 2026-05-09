jest.mock('next/server', () => ({
  NextResponse: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

jest.mock('@/lib/wordpress', () => ({
  wordpressAPI: {
    getPostsWithHeaders: jest.fn(),
    getPosts: jest.fn(),
  },
}))

jest.mock('@/lib/api/standardized', () => ({
  standardizedAPI: {
    getAllPosts: jest.fn(),
  },
}))

jest.mock('@/lib/utils/logger')

const { logger: mockLogger } = require('@/lib/utils/logger')

const createMockRequest = (url: string) => {
  return {
    url: `http://localhost:3000${url}`
  } as unknown as Request
}

describe('Posts API Route', () => {
  let mockGetAllPosts: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    const { standardizedAPI } = require('@/lib/api/standardized')
    mockGetAllPosts = standardizedAPI.getAllPosts as jest.Mock
  })

  const mockPost = {
    id: 1,
    title: { rendered: 'Test Post Title' },
    excerpt: { rendered: '<p>Test excerpt</p>' },
    slug: 'test-post-slug',
    featured_media: 123,
    date: '2026-02-25T10:00:00Z',
    categories: [1, 2],
    tags: [3, 4]
  }

  const mockSuccessfulResult = {
    data: [mockPost],
    error: null,
    metadata: { timestamp: '2026-02-25T10:00:00Z', endpoint: '/wp/v2/posts' },
    pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 }
  }

  describe('GET /api/posts', () => {
    it('should return 200 with posts array on successful fetch', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([
        {
          id: 1,
          title: { rendered: 'Test Post Title' },
          excerpt: { rendered: '<p>Test excerpt</p>' },
          slug: 'test-post-slug',
          featured_media: 123,
          date: '2026-02-25T10:00:00Z',
          categories: [1, 2],
          tags: [3, 4]
        }
      ])
    })

    it('should use default pagination values (page=1, perPage=10)', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: 1
      })
    })

    it('should handle custom page parameter', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?page=2')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: 2
      })
    })

    it('should handle custom per_page parameter', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?per_page=20')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 20,
        page: 1
      })
    })

    it('should handle both page and per_page parameters', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?page=3&per_page=5')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 5,
        page: 3
      })
    })

    it('should handle categories parameter', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?categories=1,2')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: 1,
        categories: '1,2'
      })
    })

    it('should return empty array when API returns unsuccessful result', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue({
        data: [],
        error: { message: 'API Error' } as unknown as never,
        metadata: { timestamp: '2026-02-25T10:00:00Z', endpoint: '/wp/v2/posts' },
        pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 }
      })

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch posts from API',
        undefined,
        { module: 'api/posts' }
      )
    })

    it('should return empty array when API returns null data', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue({
        data: null,
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z', endpoint: '/wp/v2/posts' },
        pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 }
      })

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return empty array on thrown error', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockRejectedValue(new Error('Network error'))

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in /api/posts',
        expect.any(Error),
        { module: 'api/posts' }
      )
    })

    it('should return empty array when API returns empty data array', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue({
        data: [],
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z', endpoint: '/wp/v2/posts' },
        pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 }
      })

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle invalid page parameter (non-numeric) - passes NaN to API', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?page=abc')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: NaN
      })
    })

    it('should handle invalid per_page parameter (non-numeric) - passes NaN to API', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?per_page=xyz')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: NaN,
        page: 1
      })
    })

    it('should handle empty page parameter', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?page=')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: 1
      })
    })

    it('should handle negative page parameter - passes through to API', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?page=-1')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: -1
      })
    })

    it('should handle zero page parameter - passes through to API', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts?page=0')
      await GET(request)

      expect(mockGetAllPosts).toHaveBeenCalledWith({
        per_page: 10,
        page: 0
      })
    })
  })

  describe('Cache Control Headers', () => {
    it('should include Cache-Control header in response', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts')
      const response = await GET(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toBeDefined()
    })

    it('should have correct cache-control header values', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts')
      const response = await GET(request)

      const cacheControl = response.headers.get('Cache-Control')
      const CACHE_TIMES = require('@/lib/api/config').CACHE_TIMES
      const expectedMaxAge = CACHE_TIMES.MEDIUM_SHORT / 1000
      const expectedStaleWhileRevalidate = CACHE_TIMES.MEDIUM / 1000

      expect(cacheControl).toContain(`max-age=${expectedMaxAge}`)
      expect(cacheControl).toContain(`s-maxage=${expectedMaxAge}`)
      expect(cacheControl).toContain(`stale-while-revalidate=${expectedStaleWhileRevalidate}`)
      expect(cacheControl).toContain('public')
    })
  })

  describe('Response structure', () => {
    it('should return array of posts with correct properties', async () => {
      const { GET } = require('@/app/api/posts/route')
      mockGetAllPosts.mockResolvedValue(mockSuccessfulResult)

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('title')
      expect(data[0]).toHaveProperty('excerpt')
      expect(data[0]).toHaveProperty('slug')
      expect(data[0]).toHaveProperty('featured_media')
      expect(data[0]).toHaveProperty('date')
      expect(data[0]).toHaveProperty('categories')
      expect(data[0]).toHaveProperty('tags')
    })

    it('should handle multiple posts', async () => {
      const { GET } = require('@/app/api/posts/route')
      const multiplePostsResult = {
        data: [
          mockPost,
          { ...mockPost, id: 2, title: { rendered: 'Second Post' }, slug: 'second-post' }
        ],
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z', endpoint: '/wp/v2/posts' },
        pagination: { page: 1, perPage: 10, total: 2, totalPages: 1 }
      }
      mockGetAllPosts.mockResolvedValue(multiplePostsResult)

      const request = createMockRequest('/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })
  })
})