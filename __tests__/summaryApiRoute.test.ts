import { NextRequest, NextResponse } from 'next/server'
import { GET as SummaryGET } from '@/app/api/summary/[id]/route'
import { wordpressAPI } from '@/lib/wordpress'
import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer'
import { logger } from '@/lib/utils/logger'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'
import type { WordPressPost } from '@/types/wordpress'

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body: any, init?: any) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
      headers: {
        get: (key: string) => null,
      },
    })),
  },
}))

jest.mock('@/lib/wordpress')
jest.mock('@/lib/services/summarizer')
jest.mock('@/lib/utils/logger')
jest.mock('@/lib/api/rateLimitMiddleware')

const mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>
const mockedSummarizePost = summarizePost as jest.MockedFunction<typeof summarizePost>
const mockedIsSummarizationEnabled = isSummarizationEnabled as jest.MockedFunction<typeof isSummarizationEnabled>
const mockedGetSummarizationConfig = getSummarizationConfig as jest.MockedFunction<typeof getSummarizationConfig>

const mockRequest = (id: string) => {
  return {
    url: `http://localhost:3000/api/summary/${id}`,
  } as unknown as NextRequest
}

const mockParams = (id: string) => Promise.resolve({ id })

describe('/api/summary/[id] Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  describe('GET /api/summary', () => {
    const mockPost: WordPressPost = {
      id: 123,
      title: { rendered: 'Test Post Title' },
      content: { rendered: '<p>This is the content of the test post.</p>' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test-post',
      date: '2026-03-10T10:00:00Z',
      modified: '2026-03-10T12:00:00Z',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post'
    }

    const mockSummaryResult = {
      summary: 'This is a test summary.',
      originalLength: 100,
      summaryLength: 50,
      cached: false,
      generatedAt: '2026-03-10T10:00:00Z'
    }

    it('should return 200 with summary for valid post ID', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockedSummarizePost.mockResolvedValue(mockSummaryResult)
      mockedIsSummarizationEnabled.mockReturnValue(true)
      mockedGetSummarizationConfig.mockReturnValue({ provider: 'openai' })

      const response = await SummaryGET(mockRequest('123'), { params: mockParams('123') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.postId).toBe(123)
      expect(data.useAiSummary).toBe(true)
      expect(data.summary).toBe('This is a test summary.')
      expect(data.originalLength).toBe(100)
      expect(data.summaryLength).toBe(50)
      expect(data.cached).toBe(false)
      expect(data.config.provider).toBe('openai')
      expect(data.config.enabled).toBe(true)
      expect(mockedWordpressAPI.getPostById).toHaveBeenCalledWith(123)
      expect(mockedSummarizePost).toHaveBeenCalledWith(123, '<p>This is the content of the test post.</p>')
    })

    it('should return 400 for invalid post ID (non-numeric)', async () => {
      const response = await SummaryGET(mockRequest('abc'), { params: mockParams('abc') } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid post ID')
      expect(mockedWordpressAPI.getPostById).not.toHaveBeenCalled()
    })

    it('should return 400 for empty post ID', async () => {
      const response = await SummaryGET(mockRequest(''), { params: mockParams('') } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid post ID')
    })

    it('should return 404 when post is not found', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(null as unknown as WordPressPost)

      const response = await SummaryGET(mockRequest('999'), { params: mockParams('999') } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Post not found')
      expect(mockedWordpressAPI.getPostById).toHaveBeenCalledWith(999)
    })

    it('should return 500 when summarizePost throws an error', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockedSummarizePost.mockRejectedValue(new Error('Summarization failed'))

      const response = await SummaryGET(mockRequest('123'), { params: mockParams('123') } as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate summary')
      expect(logger.error).toHaveBeenCalledWith(
        'Summary API error',
        expect.any(Error),
        { module: 'summary-api' }
      )
    })

    it('should return 500 when getPostById throws an error', async () => {
      mockedWordpressAPI.getPostById.mockRejectedValue(new Error('WordPress API error'))

      const response = await SummaryGET(mockRequest('123'), { params: mockParams('123') } as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate summary')
      expect(logger.error).toHaveBeenCalledWith(
        'Summary API error',
        expect.any(Error),
        { module: 'summary-api' }
      )
    })

    it('should handle floating point numbers as valid ID (parseInt truncates)', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(null as unknown as WordPressPost)

      const response = await SummaryGET(mockRequest('123.45'), { params: mockParams('123.45') } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
    })

    it('should handle negative numbers as valid ID (parseInt truncates to positive)', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(null as unknown as WordPressPost)

      const response = await SummaryGET(mockRequest('-1'), { params: mockParams('-1') } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
    })

    it('should handle special characters in ID (parseInt extracts valid prefix)', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(null as unknown as WordPressPost)

      const response = await SummaryGET(mockRequest('123!@#'), { params: mockParams('123!@#') } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
    })

    it('should include generatedAt in response', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockedSummarizePost.mockResolvedValue(mockSummaryResult)
      mockedIsSummarizationEnabled.mockReturnValue(true)
      mockedGetSummarizationConfig.mockReturnValue({ provider: 'openai' })

      const response = await SummaryGET(mockRequest('123'), { params: mockParams('123') } as any)
      const data = await response.json()

      expect(data.generatedAt).toBeDefined()
    })

    it('should call logger.info on successful request', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockedSummarizePost.mockResolvedValue(mockSummaryResult)
      mockedIsSummarizationEnabled.mockReturnValue(true)
      mockedGetSummarizationConfig.mockReturnValue({ provider: 'openai' })

      await SummaryGET(mockRequest('123'), { params: mockParams('123') } as any)

      expect(logger.info).toHaveBeenCalledWith(
        'Summary API request',
        { postId: 123, module: 'summary-api' }
      )
    })

    it('should return summary with cached flag true', async () => {
      const cachedSummaryResult = {
        summary: 'This is a cached summary.',
        originalLength: 100,
        summaryLength: 50,
        cached: true,
        generatedAt: '2026-03-10T10:00:00Z'
      }

      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost)
      mockedSummarizePost.mockResolvedValue(cachedSummaryResult)
      mockedIsSummarizationEnabled.mockReturnValue(true)
      mockedGetSummarizationConfig.mockReturnValue({ provider: 'openai' })

      const response = await SummaryGET(mockRequest('123'), { params: mockParams('123') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cached).toBe(true)
      expect(data.summary).toBe('This is a cached summary.')
    })
  })
})
