import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

let mockHeaders: Record<string, string> = {}

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => {
      const headers: any = {
        get: (key: string) => {
          const combined = { ...(init?.headers || {}), ...mockHeaders }
          return typeof combined === 'object' && key in combined ? combined[key] : null
        },
        set: jest.fn((key: string, value: string) => {
          mockHeaders[key] = value
        })
      }
      return {
        status: init?.status || 200,
        json: () => Promise.resolve(body),
        headers
      }
    })
  }
}))

describe('API Rate Limiting Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders = {}
  })

  describe('withApiRateLimit', () => {
    it('should add rate limit headers to successful response', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        require('next/server').NextResponse.json({ success: true })
      )
      const wrappedHandler = withApiRateLimit(mockHandler, 'metrics')

      const response = await wrappedHandler({} as any)

      expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset-After')).toBeDefined()
    })

    it('should track separate limits per key', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        require('next/server').NextResponse.json({ success: true })
      )
      const healthHandler = withApiRateLimit(mockHandler, 'health')
      const metricsHandler = withApiRateLimit(mockHandler, 'metrics')

      const healthResponse = await healthHandler({} as any)
      const metricsResponse = await metricsHandler({} as any)

      expect(healthResponse.status).toBe(200)
      expect(metricsResponse.status).toBe(200)
    })

    it('should block requests when limit exceeded', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        require('next/server').NextResponse.json({ success: true })
      )
      const wrappedHandler = withApiRateLimit(mockHandler, 'cache')

      for (let i = 0; i < 10; i++) {
        await wrappedHandler({} as any)
      }

      const response = await wrappedHandler({} as any)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('should return error response with retry info', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        require('next/server').NextResponse.json({ success: true })
      )
      const wrappedHandler = withApiRateLimit(mockHandler, 'cache')

      for (let i = 0; i < 10; i++) {
        await wrappedHandler({} as any)
      }

      const response = await wrappedHandler({} as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('Rate limit exceeded')
      expect(data.retryAfter).toBeGreaterThan(0)
    })

    it('should set retry-after header in error response', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        require('next/server').NextResponse.json({ success: true })
      )
      const wrappedHandler = withApiRateLimit(mockHandler, 'metrics')

      for (let i = 0; i < 60; i++) {
        await wrappedHandler({} as any)
      }

      const response = await wrappedHandler({} as any)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBeDefined()
    })
  })
})
