import { GET as PostsGET } from '@/app/api/posts/route'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/api/standardized')
jest.mock('@/lib/api/response')
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

const mockRequest = (url: string) => ({ url } as any)

describe('/api/posts route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  it('returns posts array on successful fetch', async () => {
    const mockPosts = [
      {
        id: 1,
        title: { rendered: 'Test Post 1' },
        excerpt: { rendered: '<p>Excerpt 1</p>' },
        slug: 'test-post-1',
        featured_media: 123,
        date: '2026-01-01T00:00:00Z',
        categories: [1, 2],
        tags: [3, 4]
      }
    ]

    const mockResult = {
      data: mockPosts,
      error: null,
      metadata: { timestamp: '2026-01-01T00:00:00Z', endpoint: '/posts', cacheHit: false, retryCount: 0 },
      pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 }
    }

    ;(standardizedAPI.getAllPosts as any).mockResolvedValue(mockResult)
    ;(isApiResultSuccessful as any).mockReturnValue(true)

    const response = await PostsGET(mockRequest('http://localhost:3000/api/posts'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(1)
    expect(json[0].id).toBe(1)
    expect(json[0].title).toEqual({ rendered: 'Test Post 1' })
  })

  it('returns empty array on API failure', async () => {
    ;(standardizedAPI.getAllPosts as any).mockRejectedValue(new Error('Network error'))
    ;(isApiResultSuccessful as any).mockReturnValue(false)

    const response = await PostsGET(mockRequest('http://localhost:3000/api/posts'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual([])
  })

  it('returns empty array when result data is null', async () => {
    const mockResult = {
      data: null,
      error: null,
      metadata: { timestamp: '2026-01-01T00:00:00Z', endpoint: '/posts', cacheHit: false, retryCount: 0 }
    }

    ;(standardizedAPI.getAllPosts as any).mockResolvedValue(mockResult)
    ;(isApiResultSuccessful as any).mockReturnValue(false)

    const response = await PostsGET(mockRequest('http://localhost:3000/api/posts'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual([])
  })

  it('handles query parameters correctly', async () => {
    const mockPosts = [
      {
        id: 1,
        title: { rendered: 'Test Post' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        slug: 'test-post',
        featured_media: 0,
        date: '2026-01-01T00:00:00Z',
        categories: [],
        tags: []
      }
    ]

    const mockResult = {
      data: mockPosts,
      error: null,
      metadata: { timestamp: '2026-01-01T00:00:00Z', endpoint: '/posts', cacheHit: false, retryCount: 0 },
      pagination: { page: 2, perPage: 5, total: 10, totalPages: 2 }
    }

    ;(standardizedAPI.getAllPosts as any).mockResolvedValue(mockResult)
    ;(isApiResultSuccessful as any).mockReturnValue(true)

    const response = await PostsGET(mockRequest('http://localhost:3000/api/posts?categories=1&per_page=5&page=2'))

    expect(standardizedAPI.getAllPosts).toHaveBeenCalledWith({
      per_page: 5,
      page: 2,
      categories: '1'
    })
  })

  it('sets cache control headers', async () => {
    const mockPosts = [
      {
        id: 1,
        title: { rendered: 'Test Post' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        slug: 'test-post',
        featured_media: 0,
        date: '2026-01-01T00:00:00Z',
        categories: [],
        tags: []
      }
    ]

    const mockResult = {
      data: mockPosts,
      error: null,
      metadata: { timestamp: '2026-01-01T00:00:00Z', endpoint: '/posts', cacheHit: false, retryCount: 0 },
      pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 }
    }

    ;(standardizedAPI.getAllPosts as any).mockResolvedValue(mockResult)
    ;(isApiResultSuccessful as any).mockReturnValue(true)

    const response = await PostsGET(mockRequest('http://localhost:3000/api/posts'))

    expect(response.headers.get('Cache-Control')).toContain('public')
    expect(response.headers.get('Cache-Control')).toContain('max-age=')
  })
})