import { GET as MediaGET } from '@/app/api/media/[id]/route'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/api/standardized')
jest.mock('@/lib/api/response', () => ({
  isApiResultSuccessful: jest.fn()
}))
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

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

const { standardizedAPI: mockStandardizedAPI } = require('@/lib/api/standardized')
const { isApiResultSuccessful: mockIsApiResultSuccessful } = require('@/lib/api/response')

describe('Media API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
    mockIsApiResultSuccessful.mockReturnValue(true)
  })

  describe('GET /api/media/[id]', () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/media/123'
    } as any

    it('should return media source_url when media is found', async () => {
      const mockMediaResult = {
        data: {
          id: 123,
          source_url: 'https://example.com/wp-content/uploads/2024/01/image.jpg',
          alt_text: 'Test image',
          title: { rendered: 'Test Image' },
          mime_type: 'image/jpeg'
        },
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z' }
      }
      mockStandardizedAPI.getMediaById.mockResolvedValue(mockMediaResult)

      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: '123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBe('https://example.com/wp-content/uploads/2024/01/image.jpg')
      expect(data.alt_text).toBe('Test image')
    })

    it('should return source_url null when id is NaN', async () => {
      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: 'abc' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return source_url null when API returns unsuccessful result', async () => {
      mockIsApiResultSuccessful.mockReturnValue(false)

      const mockErrorResult = {
        data: null,
        error: { message: 'Not found', code: 404 },
        metadata: { timestamp: '2026-02-25T10:00:00Z' }
      }
      mockStandardizedAPI.getMediaById.mockResolvedValue(mockErrorResult)

      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return source_url null when data is null', async () => {
      mockIsApiResultSuccessful.mockReturnValue(true)

      const mockNullDataResult = {
        data: null,
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z' }
      }
      mockStandardizedAPI.getMediaById.mockResolvedValue(mockNullDataResult)

      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: '456' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return source_url null when exception is thrown', async () => {
      mockStandardizedAPI.getMediaById.mockRejectedValue(new Error('Network error'))

      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: '789' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should handle media with empty alt_text', async () => {
      mockIsApiResultSuccessful.mockReturnValue(true)

      const mockMediaResult = {
        data: {
          id: 123,
          source_url: 'https://example.com/wp-content/uploads/2024/01/image.jpg',
          alt_text: '',
          title: { rendered: 'Test Image' }
        },
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z' }
      }
      mockStandardizedAPI.getMediaById.mockResolvedValue(mockMediaResult)

      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: '123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBe('https://example.com/wp-content/uploads/2024/01/image.jpg')
      expect(data.alt_text).toBe('')
    })

    it('should correctly parse numeric id from string', async () => {
      mockIsApiResultSuccessful.mockReturnValue(true)

      const mockMediaResult = {
        data: {
          id: 42,
          source_url: 'https://example.com/wp-content/uploads/2024/02/photo.png',
          alt_text: 'Photo'
        },
        error: null,
        metadata: { timestamp: '2026-02-25T10:00:00Z' }
      }
      mockStandardizedAPI.getMediaById.mockResolvedValue(mockMediaResult)

      const response = await MediaGET(mockRequest, { params: Promise.resolve({ id: '42' }) })
      const data = await response.json()

      expect(mockStandardizedAPI.getMediaById).toHaveBeenCalledWith(42)
      expect(data.source_url).toBe('https://example.com/wp-content/uploads/2024/02/photo.png')
    })
  })
})
