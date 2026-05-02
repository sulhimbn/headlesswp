import { GET as EnvironmentGET } from '@/app/api/health/environment/route'
import { getEnvironmentStatus } from '@/lib/config/envValidation'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/config/envValidation')
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

const { getEnvironmentStatus: mockGetEnvironmentStatus } = require('@/lib/config/envValidation')

describe('Health Environment API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  describe('GET /api/health/environment', () => {
    const mockRequest = {} as any

    it('should return 200 with valid environment status when all required vars are set', async () => {
      const mockStatus = {
        valid: true,
        timestamp: '2026-02-25T10:00:00Z',
        required: [
          { name: 'NEXT_PUBLIC_WORDPRESS_URL', required: true, description: 'WordPress URL', value: '***SET***' }
        ],
        optional: [
          { name: 'NEXT_PUBLIC_SITE_URL', required: false, description: 'Site URL', value: '***SET***' }
        ],
        missing: [],
        warnings: []
      }
      mockGetEnvironmentStatus.mockReturnValue(mockStatus)

      const response = await EnvironmentGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.timestamp).toBeDefined()
      expect(data.required).toHaveLength(1)
      expect(data.missing).toHaveLength(0)
    })

    it('should return 500 with invalid environment status when required vars are missing', async () => {
      const mockStatus = {
        valid: false,
        timestamp: '2026-02-25T10:00:00Z',
        required: [
          { name: 'NEXT_PUBLIC_WORDPRESS_URL', required: true, description: 'WordPress URL', value: 'NOT_SET' }
        ],
        optional: [],
        missing: ['NEXT_PUBLIC_WORDPRESS_URL'],
        warnings: []
      }
      mockGetEnvironmentStatus.mockReturnValue(mockStatus)

      const response = await EnvironmentGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.valid).toBe(false)
      expect(data.missing).toContain('NEXT_PUBLIC_WORDPRESS_URL')
    })

    it('should return 500 when environment validation fails', async () => {
      const mockStatus = {
        valid: false,
        timestamp: '2026-02-25T10:00:00Z',
        required: [
          { name: 'NEXT_PUBLIC_WORDPRESS_URL', required: true, description: 'WordPress URL', value: 'NOT_SET' },
          { name: 'NEXT_PUBLIC_WORDPRESS_API_URL', required: true, description: 'API URL', value: 'NOT_SET' }
        ],
        optional: [],
        missing: ['NEXT_PUBLIC_WORDPRESS_URL', 'NEXT_PUBLIC_WORDPRESS_API_URL'],
        warnings: []
      }
      mockGetEnvironmentStatus.mockReturnValue(mockStatus)

      const response = await EnvironmentGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.valid).toBe(false)
      expect(data.missing).toHaveLength(2)
    })

    it('should include optional env vars with warnings', async () => {
      const mockStatus = {
        valid: true,
        timestamp: '2026-02-25T10:00:00Z',
        required: [
          { name: 'NEXT_PUBLIC_WORDPRESS_URL', required: true, description: 'WordPress URL', value: '***SET***' }
        ],
        optional: [
          { name: 'NEXT_PUBLIC_SITE_URL', required: false, description: 'Site URL', value: 'NOT_SET' }
        ],
        missing: [],
        warnings: ['NEXT_PUBLIC_SITE_URL is not set (optional)']
      }
      mockGetEnvironmentStatus.mockReturnValue(mockStatus)

      const response = await EnvironmentGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.warnings).toContain('NEXT_PUBLIC_SITE_URL is not set (optional)')
      expect(data.optional).toHaveLength(1)
    })

    it('should set no-cache headers', async () => {
      const mockStatus = {
        valid: true,
        timestamp: '2026-02-25T10:00:00Z',
        required: [],
        optional: [],
        missing: [],
        warnings: []
      }
      mockGetEnvironmentStatus.mockReturnValue(mockStatus)

      const response = await EnvironmentGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should mask actual env values for security', async () => {
      const mockStatus = {
        valid: true,
        timestamp: '2026-02-25T10:00:00Z',
        required: [
          { name: 'NEXT_PUBLIC_WORDPRESS_URL', required: true, description: 'WordPress URL', value: '***SET***' }
        ],
        optional: [],
        missing: [],
        warnings: []
      }
      mockGetEnvironmentStatus.mockReturnValue(mockStatus)

      const response = await EnvironmentGET(mockRequest)
      const data = await response.json()

      expect(data.required[0].value).toBe('***SET***')
      expect(data.required[0].value).not.toBe('https://real-value.com')
    })
  })
})
