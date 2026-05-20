import { NextRequest, NextResponse } from 'next/server'
import { GET as SummaryGET } from '@/app/api/summary/[id]/route'
import { GET as MediaGET } from '@/app/api/media/[id]/route'
import { wordpressAPI } from '@/lib/wordpress'
import { standardizedAPI } from '@/lib/api/standardized'
import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer'
import { logger } from '@/lib/utils/logger'
import type { WordPressPost, WordPressMedia } from '@/types/wordpress'
import { createSuccessResult, createErrorResult } from '@/lib/api/response'
import { ApiErrorType } from '@/lib/api/errors'

jest.mock('@/lib/wordpress')
jest.mock('@/lib/api/standardized')
jest.mock('@/lib/services/summarizer')
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

const mockWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>
const mockStandardizedAPI = standardizedAPI as jest.Mocked<typeof standardizedAPI>
const mockSummarizer = summarizePost as jest.MockedFunction<typeof summarizePost>
const mockIsSummarizationEnabled = isSummarizationEnabled as jest.MockedFunction<typeof isSummarizationEnabled>
const mockGetSummarizationConfig = getSummarizationConfig as jest.MockedFunction<typeof getSummarizationConfig>
const mockLogger = logger as jest.Mocked<typeof logger>

const mockRequest = (id: string) => 
  ({ url: `http://localhost:3000/api/summary/${id}` } as any as NextRequest)

const mockMediaRequest = (id: string) => 
  ({ url: `http://localhost:3000/api/media/${id}` } as any as NextRequest)

describe('Summary API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSummarizationEnabled.mockReturnValue(true)
    mockGetSummarizationConfig.mockReturnValue({
      provider: 'local',
      maxTokens: 200,
      temperature: 0.7
    })
  })

  describe('GET /api/summary/[id]', () => {
    it('should return 400 for invalid post ID (non-numeric)', async () => {
      const response = await SummaryGET(mockRequest('abc'), { params: Promise.resolve({ id: 'abc' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid post ID')
    })

    it('should return 500 when post is not found (API error)', async () => {
      const error = new Error('Post not found') as Error & { response?: { status: number } }
      error.response = { status: 404 }
      mockWordpressAPI.getPostById.mockRejectedValue(error)

      const response = await SummaryGET(mockRequest('999'), { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate summary')
      expect(mockWordpressAPI.getPostById).toHaveBeenCalledWith(999)
    })

    it('should return 200 with summary for valid post ID', async () => {
      const mockPost: WordPressPost = {
        id: 123,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'test-post',
        date: '2026-02-25T10:00:00Z',
        modified: '2026-02-25T12:00:00Z',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      }

      mockWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockSummarizer.mockResolvedValue({
        summary: 'This is a test summary.',
        originalLength: 100,
        summaryLength: 25,
        cached: false,
        generatedAt: '2026-02-25T12:00:00Z'
      })

      const response = await SummaryGET(mockRequest('123'), { params: Promise.resolve({ id: '123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.postId).toBe(123)
      expect(data.useAiSummary).toBe(true)
      expect(data.summary).toBe('This is a test summary.')
      expect(data.originalLength).toBe(100)
      expect(data.summaryLength).toBe(25)
      expect(data.cached).toBe(false)
      expect(data.config.provider).toBe('local')
      expect(data.config.enabled).toBe(true)
    })

    it('should return 200 with cached summary', async () => {
      const mockPost: WordPressPost = {
        id: 456,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'test-post',
        date: '2026-02-25T10:00:00Z',
        modified: '2026-02-25T12:00:00Z',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      }

      mockWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockSummarizer.mockResolvedValue({
        summary: 'Cached summary',
        originalLength: 100,
        summaryLength: 15,
        cached: true,
        generatedAt: '2026-02-25T12:00:00Z'
      })

      const response = await SummaryGET(mockRequest('456'), { params: Promise.resolve({ id: '456' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cached).toBe(true)
      expect(data.summary).toBe('Cached summary')
    })

    it('should return 500 when summarizePost throws an error', async () => {
      const mockPost: WordPressPost = {
        id: 789,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'test-post',
        date: '2026-02-25T10:00:00Z',
        modified: '2026-02-25T12:00:00Z',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      }

      mockWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockSummarizer.mockRejectedValue(new Error('Summarization failed'))

      const response = await SummaryGET(mockRequest('789'), { params: Promise.resolve({ id: '789' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate summary')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Summary API error',
        expect.any(Error),
        { module: 'summary-api' }
      )
    })

    it('should return 500 when getPostById throws an error', async () => {
      mockWordpressAPI.getPostById.mockRejectedValue(new Error('API error'))

      const response = await SummaryGET(mockRequest('100'), { params: Promise.resolve({ id: '100' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate summary')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Summary API error',
        expect.any(Error),
        { module: 'summary-api' }
      )
    })
  })
})

describe('Media API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/media/[id]', () => {
    it('should return 200 with source_url for valid media ID', async () => {
      const mockMedia: WordPressMedia = {
        id: 123,
        source_url: 'https://example.com/media/image.jpg',
        alt_text: 'Test image',
        title: { rendered: 'Test Image' },
        media_type: 'image',
        mime_type: 'image/jpeg'
      }

      mockStandardizedAPI.getMediaById.mockResolvedValue(
        createSuccessResult(mockMedia, { endpoint: '/wp/v2/media/123' })
      )

      const response = await MediaGET(mockMediaRequest('123'), { params: Promise.resolve({ id: '123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBe('https://example.com/media/image.jpg')
      expect(data.alt_text).toBe('Test image')
      expect(mockStandardizedAPI.getMediaById).toHaveBeenCalledWith(123)
    })

    it('should return 200 with source_url: null for invalid media ID (NaN)', async () => {
      const response = await MediaGET(mockMediaRequest('abc'), { params: Promise.resolve({ id: 'abc' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
      expect(mockStandardizedAPI.getMediaById).not.toHaveBeenCalled()
    })

    it('should return 200 with source_url: null for non-existent media', async () => {
      mockStandardizedAPI.getMediaById.mockResolvedValue(
        createErrorResult({
          type: ApiErrorType.CLIENT_ERROR,
          message: 'Invalid media ID',
          retryable: false,
          timestamp: new Date().toISOString()
        }, { endpoint: '/wp/v2/media/999' })
      )

      const response = await MediaGET(mockMediaRequest('999'), { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return 200 with source_url: null when standardizedAPI throws error', async () => {
      mockStandardizedAPI.getMediaById.mockRejectedValue(new Error('Network error'))

      const response = await MediaGET(mockMediaRequest('789'), { params: Promise.resolve({ id: '789' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in /api/media/[id]',
        expect.any(Error),
        { module: 'api/media' }
      )
    })

    it('should return 200 with only available fields when alt_text is missing', async () => {
      const mockMedia: WordPressMedia = {
        id: 321,
        source_url: 'https://example.com/media/no-alt.jpg',
        alt_text: '',
        title: { rendered: 'No Alt Image' },
        media_type: 'image',
        mime_type: 'image/jpeg'
      }

      mockStandardizedAPI.getMediaById.mockResolvedValue(
        createSuccessResult(mockMedia, { endpoint: '/wp/v2/media/321' })
      )

      const response = await MediaGET(mockMediaRequest('321'), { params: Promise.resolve({ id: '321' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBe('https://example.com/media/no-alt.jpg')
      expect(data.alt_text).toBe('')
    })
  })
})
