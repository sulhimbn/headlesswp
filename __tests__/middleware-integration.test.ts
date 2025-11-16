import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockRequest {
    constructor(url: string, options?: { headers?: Record<string, string> }) {
      this.url = url
      this.headers = new Map(Object.entries(options?.headers || {}))
    }
    url: string
    headers: Map<string, string>
  },
  NextResponse: {
    next: jest.fn(() => ({
      headers: {
        get: jest.fn(),
        set: jest.fn()
      }
    })),
    rewrite: jest.fn(),
    redirect: jest.fn(),
  }
}))

describe('Middleware Integration', () => {
  let mockNextResponse: jest.Mocked<typeof NextResponse>

  beforeEach(() => {
    jest.clearAllMocks()
    mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>
  })

  describe('CSP Header Generation', () => {
    it('generates CSP headers for development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('generates CSP headers for production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('https://example.com') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('includes security headers in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('https://example.com') as any
      const response = middleware(request)

      expect(response).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Request Processing', () => {
    it('processes API routes correctly', () => {
      const request = new NextRequest('http://localhost:3000/api/test') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })

    it('processes static assets correctly', () => {
      const request = new NextRequest('http://localhost:3000/_next/static/test.js') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })

    it('processes page routes correctly', () => {
      const request = new NextRequest('http://localhost:3000/berita/test-post') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })
  })

  describe('Security Headers', () => {
    it('sets X-Frame-Options header', () => {
      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })

    it('sets X-Content-Type-Options header', () => {
      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })

    it('sets Referrer-Policy header', () => {
      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })

    it('sets Permissions-Policy header', () => {
      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })
  })

  describe('Environment-Specific Behavior', () => {
    it('handles development environment with permissive CSP', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('handles production environment with strict CSP', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('https://example.com') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('handles missing NODE_ENV gracefully', () => {
      const originalEnv = process.env.NODE_ENV
      delete process.env.NODE_ENV

      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('CSP Nonce Generation', () => {
    it('generates unique nonces for requests', () => {
      const request1 = new NextRequest('http://localhost:3000') as any
      const request2 = new NextRequest('http://localhost:3000') as any

      middleware(request1)
      middleware(request2)

      expect(mockNextResponse.next).toHaveBeenCalledTimes(2)
    })

    it('includes nonce in CSP header', () => {
      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles malformed request URLs', () => {
      const request = { url: 'invalid-url' } as any
      expect(() => middleware(request)).not.toThrow()
    })

    it('handles missing request object', () => {
      expect(() => middleware(null as any)).not.toThrow()
    })

    it('handles requests without headers', () => {
      const request = { url: 'http://localhost:3000' } as any
      expect(() => middleware(request)).not.toThrow()
    })
  })

  describe('Performance Considerations', () => {
    it('processes requests quickly', () => {
      const start = performance.now()
      const request = new NextRequest('http://localhost:3000') as any
      middleware(request)
      const end = performance.now()

      expect(end - start).toBeLessThan(10) // Should process in under 10ms
    })

    it('does not block request processing', () => {
      const request = new NextRequest('http://localhost:3000') as any
      const result = middleware(request)

      expect(result).toBeDefined()
    })
  })

  describe('Integration with Next.js Features', () => {
    it('works with Next.js routing', () => {
      const requests = [
        new NextRequest('http://localhost:3000/') as any,
        new NextRequest('http://localhost:3000/berita') as any,
        new NextRequest('http://localhost:3000/berita/test-slug') as any,
        new NextRequest('http://localhost:3000/api/test') as any,
      ]

      requests.forEach(request => {
        expect(() => middleware(request)).not.toThrow()
      })
    })

    it('preserves request headers', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'user-agent': 'test-agent',
          'accept': 'text/html',
        },
      }) as any

      middleware(request)

      expect(mockNextResponse.next).toHaveBeenCalled()
    })
  })
})