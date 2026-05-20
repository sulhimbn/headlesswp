import { NextRequest, NextResponse } from 'next/server'
import { GET as MediaGET } from '@/app/api/media/[id]/route'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'
import { ApiErrorType } from '@/lib/api/errors'
import type { WordPressMedia } from '@/types/wordpress'

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

jest.mock('@/lib/api/standardized')
jest.mock('@/lib/api/response')
jest.mock('@/lib/utils/logger')
jest.mock('@/lib/api/rateLimitMiddleware')

const mockedStandardizedAPI = standardizedAPI as jest.Mocked<typeof standardizedAPI>
const mockedIsApiResultSuccessful = isApiResultSuccessful as jest.MockedFunction<typeof isApiResultSuccessful>

const mockRequest = (id: string) => {
  return {
    url: `http://localhost:3000/api/media/${id}`,
  } as unknown as NextRequest
}

const mockParams = (id: string) => Promise.resolve({ id })

describe('/api/media/[id] Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  describe('GET /api/media', () => {
    const mockMedia = {
      id: 456,
      source_url: 'https://example.com/wp-content/uploads/2026/03/image.jpg',
      title: { rendered: 'Test Image' },
      alt_text: 'A test image',
      media_type: 'image',
      mime_type: 'image/jpeg'
    }

    it('should return 200 with media data for valid media ID', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: mockMedia,
        error: null,
        metadata: { endpoint: '/wp/v2/media/456', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(true)

      const response = await MediaGET(mockRequest('456'), { params: mockParams('456') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBe('https://example.com/wp-content/uploads/2026/03/image.jpg')
      expect(data.alt_text).toBe('A test image')
      expect(mockedStandardizedAPI.getMediaById).toHaveBeenCalledWith(456)
    })

    it('should return 200 with source_url null for invalid/non-numeric ID', async () => {
      const response = await MediaGET(mockRequest('abc'), { params: mockParams('abc') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
      expect(mockedStandardizedAPI.getMediaById).not.toHaveBeenCalled()
    })

    it('should return 200 with source_url null for empty ID', async () => {
      const response = await MediaGET(mockRequest(''), { params: mockParams('') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return 200 with source_url null when media is not found', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: null as unknown as WordPressMedia,
        error: { type: ApiErrorType.CLIENT_ERROR, statusCode: 404, message: 'Not found', retryable: false, timestamp: '2026-03-10T10:00:00Z' },
        metadata: { endpoint: '/wp/v2/media/999', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(false)

      const response = await MediaGET(mockRequest('999'), { params: mockParams('999') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return 200 with source_url null when API result is unsuccessful', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: null as unknown as WordPressMedia,
        error: { type: ApiErrorType.SERVER_ERROR, statusCode: 500, message: 'Server error', retryable: true, timestamp: '2026-03-10T10:00:00Z' },
        metadata: { endpoint: '/wp/v2/media/456', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(false)

      const response = await MediaGET(mockRequest('456'), { params: mockParams('456') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return 200 with source_url null when getMediaById throws an error', async () => {
      mockedStandardizedAPI.getMediaById.mockRejectedValue(new Error('API Error'))

      const response = await MediaGET(mockRequest('456'), { params: mockParams('456') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
      expect(logger.error).toHaveBeenCalledWith(
        'Error in /api/media/[id]',
        expect.any(Error),
        { module: 'api/media' }
      )
    })

    it('should return 200 with source_url null for negative ID', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: null as unknown as WordPressMedia,
        error: { type: ApiErrorType.CLIENT_ERROR, statusCode: 404, message: 'Not found', retryable: false, timestamp: '2026-03-10T10:00:00Z' },
        metadata: { endpoint: '/wp/v2/media/-1', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(false)

      const response = await MediaGET(mockRequest('-1'), { params: mockParams('-1') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should handle floating point numbers (parseInt truncates)', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: null as unknown as WordPressMedia,
        error: { type: ApiErrorType.CLIENT_ERROR, statusCode: 404, message: 'Not found', retryable: false, timestamp: '2026-03-10T10:00:00Z' },
        metadata: { endpoint: '/wp/v2/media/123', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(false)

      const response = await MediaGET(mockRequest('123.45'), { params: mockParams('123.45') } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source_url).toBeNull()
    })

    it('should return media with alt_text', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: mockMedia,
        error: null,
        metadata: { endpoint: '/wp/v2/media/456', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(true)

      const response = await MediaGET(mockRequest('456'), { params: mockParams('456') } as any)
      const data = await response.json()

      expect(data.alt_text).toBe('A test image')
    })

    it('should return only source_url and alt_text in response', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue({
        data: mockMedia,
        error: null,
        metadata: { endpoint: '/wp/v2/media/456', timestamp: '2026-03-10T10:00:00Z' }
      })
      mockedIsApiResultSuccessful.mockReturnValue(true)

      const response = await MediaGET(mockRequest('456'), { params: mockParams('456') } as any)
      const data = await response.json()

      expect(Object.keys(data)).toContain('source_url')
      expect(Object.keys(data)).toContain('alt_text')
      expect(Object.keys(data).length).toBe(2)
    })
  })
})
