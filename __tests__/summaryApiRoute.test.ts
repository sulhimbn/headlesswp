import { GET as SummaryGET } from '@/app/api/summary/[id]/route'
import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer'
import { wordpressAPI } from '@/lib/wordpress'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/services/summarizer')
jest.mock('@/lib/wordpress')
jest.mock('@/lib/utils/logger')
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
      headers: {
        get: () => null,
        set: () => {}
      }
    }))
  }
}))

const mockRequest = (url: string) => ({ url } as any)
const { summarizePost: mockSummarizePost, isSummarizationEnabled: mockIsEnabled, getSummarizationConfig: mockGetConfig } = require('@/lib/services/summarizer')
const { wordpressAPI: mockWordPressAPI } = require('@/lib/wordpress')

describe('/api/summary/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  it('returns summary on successful generation', async () => {
    const mockPost = { id: 123, content: { rendered: '<p>Test content</p>' } }
    const mockSummary = {
      summary: 'This is a test summary',
      originalLength: 100,
      summaryLength: 20,
      cached: false,
      generatedAt: '2026-01-01T00:00:00Z'
    }

    mockWordPressAPI.getPostById.mockResolvedValue(mockPost)
    mockSummarizePost.mockResolvedValue(mockSummary)
    mockIsEnabled.mockReturnValue(true)
    mockGetConfig.mockReturnValue({ provider: 'openai', enabled: true })

    const response = await SummaryGET(mockRequest('http://localhost:3000/api/summary/123'), { params: Promise.resolve({ id: '123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.postId).toBe(123)
    expect(json.summary).toBe('This is a test summary')
    expect(json.cached).toBe(false)
  })

  it('returns 400 for invalid post ID', async () => {
    const response = await SummaryGET(mockRequest('http://localhost:3000/api/summary/abc'), { params: Promise.resolve({ id: 'abc' }) })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid post ID')
  })

  it('returns 404 when post not found', async () => {
    mockWordPressAPI.getPostById.mockResolvedValue(null)

    const response = await SummaryGET(mockRequest('http://localhost:3000/api/summary/123'), { params: Promise.resolve({ id: '123' }) })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Post not found')
  })

  it('returns 500 on summarization error', async () => {
    const mockPost = { id: 123, content: { rendered: '<p>Test content</p>' } }
    mockWordPressAPI.getPostById.mockResolvedValue(mockPost)
    mockSummarizePost.mockRejectedValue(new Error('Summarization failed'))

    const response = await SummaryGET(mockRequest('http://localhost:3000/api/summary/123'), { params: Promise.resolve({ id: '123' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to generate summary')
  })
})