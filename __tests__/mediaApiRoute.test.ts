import { GET as MediaGET } from '@/app/api/media/[id]/route'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/api/standardized')
jest.mock('@/lib/api/response')
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

describe('/api/media/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  it('returns media data on successful fetch', async () => {
    const mockMedia = {
      id: 123,
      source_url: 'https://example.com/image.jpg',
      alt_text: 'Test image'
    }

    const mockResult = {
      data: mockMedia,
      error: null,
      metadata: { timestamp: '2026-01-01T00:00:00Z', endpoint: '/media/123', cacheHit: false, retryCount: 0 }
    }

    ;(standardizedAPI.getMediaById as any).mockResolvedValue(mockResult)
    ;(isApiResultSuccessful as any).mockReturnValue(true)

    const response = await MediaGET(mockRequest('http://localhost:3000/api/media/123'), { params: Promise.resolve({ id: '123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.source_url).toBe('https://example.com/image.jpg')
    expect(json.alt_text).toBe('Test image')
  })

  it('returns null source_url on invalid ID', async () => {
    const response = await MediaGET(mockRequest('http://localhost:3000/api/media/abc'), { params: Promise.resolve({ id: 'abc' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.source_url).toBeNull()
  })

  it('returns null source_url on API failure', async () => {
    ;(standardizedAPI.getMediaById as any).mockRejectedValue(new Error('Network error'))
    ;(isApiResultSuccessful as any).mockReturnValue(false)

    const response = await MediaGET(mockRequest('http://localhost:3000/api/media/123'), { params: Promise.resolve({ id: '123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.source_url).toBeNull()
  })

  it('returns null source_url when result data is null', async () => {
    const mockResult = { data: null, error: null, metadata: { timestamp: '2026-01-01T00:00:00Z', endpoint: '/media/123', cacheHit: false, retryCount: 0 } }

    ;(standardizedAPI.getMediaById as any).mockResolvedValue(mockResult)
    ;(isApiResultSuccessful as any).mockReturnValue(false)

    const response = await MediaGET(mockRequest('http://localhost:3000/api/media/123'), { params: Promise.resolve({ id: '123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.source_url).toBeNull()
  })
})