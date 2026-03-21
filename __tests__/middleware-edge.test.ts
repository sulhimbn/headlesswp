import { NextRequest, NextResponse } from 'next/server'
import { middleware, config as middlewareConfig } from '@/middleware'

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://mitrabantennews.com',
  SITE_URL_WWW: 'https://www.mitrabantennews.com',
}))

jest.mock('@/lib/utils/cspUtils', () => ({
  generateNonce: jest.fn(() => 'test-nonce-12345'),
}))

describe('Middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockNextResponse: jest.Mocked<NextResponse> & { headers: Headers }
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    jest.clearAllMocks()
    originalEnv = { ...process.env }

    mockNextResponse = {
      headers: new Headers(),
    } as unknown as jest.Mocked<NextResponse> & { headers: Headers }

    mockRequest = {
      nextUrl: {
        pathname: '/',
      },
      headers: new Headers(),
    } as unknown as jest.Mocked<NextRequest>

    ;(NextResponse.next as jest.Mock).mockReturnValue(mockNextResponse)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Edge Header Manipulation', () => {
    it('should set x-nonce header', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-nonce')).toBe('test-nonce-12345')
    })

    it('should set x-edge-processed header', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-edge-processed')).toBe('true')
    })

    it('should set x-request-cache-key header', () => {
      Object.defineProperty(mockRequest, 'nextUrl', {
        value: {
          pathname: '/berita/test-post',
          search: '?page=1',
        },
      })

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-request-cache-key')).toBe('/berita/test-post?page=1')
    })

    it('should set x-is-bot header for regular user agent', () => {
      mockRequest.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-is-bot')).toBe('0')
    })

    it('should set x-is-bot header for Google bot', () => {
      mockRequest.headers.set('user-agent', 'Googlebot/2.1')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-is-bot')).toBe('1')
    })

    it('should set x-is-bot header for Bing bot', () => {
      mockRequest.headers.set('user-agent', 'Mozilla/5.0 (compatible; Bingbot/2.0)')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-is-bot')).toBe('1')
    })

    it('should set x-is-bot header for Facebook crawler', () => {
      mockRequest.headers.set('user-agent', 'facebookexternalhit/1.1')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-is-bot')).toBe('1')
    })

    it('should handle missing user agent', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-is-bot')).toBe('0')
    })

    it('should set x-accept-language header with normalized language', () => {
      mockRequest.headers.set('accept-language', 'id-ID,id;q=0.9,en-US;q=0.8')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-accept-language')).toBe('id')
    })

    it('should handle missing accept-language header', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-accept-language')).toBeNull()
    })
  })

  describe('Geo-based Routing Preparation', () => {
    it('should extract geo from Cloudflare headers', () => {
      mockRequest.headers.set('cf-ipcountry', 'ID')

      const response = middleware(mockRequest)

      const geo = mockNextResponse.headers.get('x-geo')
      expect(geo).toContain('"country":"ID"')
    })

    it('should extract geo from Vercel headers', () => {
      mockRequest.headers.set('x-vercel-ip-country', 'US')
      mockRequest.headers.set('x-vercel-ip-country-region', 'CA')
      mockRequest.headers.set('x-vercel-ip-city', 'Los Angeles')

      const response = middleware(mockRequest)

      const geo = mockNextResponse.headers.get('x-geo')
      expect(geo).toContain('"country":"US"')
      expect(geo).toContain('"region":"CA"')
      expect(geo).toContain('"city":"Los Angeles"')
    })

    it('should not set x-geo when no geo headers present', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-geo')).toBeNull()
    })
  })

  describe('Response Header Optimization', () => {
    it('should set ETag header', () => {
      const response = middleware(mockRequest)

      const etag = mockNextResponse.headers.get('ETag')
      expect(etag).toBeDefined()
      expect(etag).toMatch(/^".*"$/)
    })

    it('should set Last-Modified header', () => {
      const response = middleware(mockRequest)

      const lastModified = mockNextResponse.headers.get('Last-Modified')
      expect(lastModified).toBeDefined()
      expect(lastModified).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/)
    })

    it('should set X-Cache-Status header', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-Cache-Status')).toBe('MISS')
    })
  })

  describe('Bot Detection for SEO', () => {
    it('should set X-SEO-Bot header for Googlebot', () => {
      mockRequest.headers.set('user-agent', 'Googlebot/2.1')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Bot')).toBe('true')
    })

    it('should set X-SEO-Bot header for Bingbot', () => {
      mockRequest.headers.set('user-agent', 'Mozilla/5.0 (compatible; Bingbot/2.0)')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Bot')).toBe('true')
    })

    it('should not set X-SEO-Bot for regular users', () => {
      mockRequest.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0)')

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Bot')).toBeNull()
    })

    it('should detect multiple bot user agents', () => {
      const botAgents = [
        'Mozilla/5.0 (compatible; YandexBot/3.0)',
        'Mozilla/5.0 (compatible; AhrefsBot/7.0)',
        'Mozilla/5.0 (compatible; SemrushBot/7~bl)',
        'Mozilla/5.0 (compatible; Applebot/0.1)',
      ]

      botAgents.forEach((agent) => {
        mockRequest.headers.set('user-agent', agent)
        const response = middleware(mockRequest)
        expect(mockNextResponse.headers.get('x-is-bot')).toBe('1')
      })
    })
  })

  describe('Security Headers', () => {
    it('should set Content-Security-Policy header', () => {
      const response = middleware(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      expect(csp).toBeDefined()
      expect(csp).toContain("default-src 'self'")
    })

    it('should set CSP with nonce', () => {
      const response = middleware(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain("'nonce-test-nonce-12345'")
    })

    it('should set Strict-Transport-Security header', () => {
      const response = middleware(mockRequest)

      const hsts = mockNextResponse.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
      expect(hsts).toContain('preload')
    })

    it('should set X-Frame-Options to DENY', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should set X-XSS-Protection header', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should set Referrer-Policy header', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should set Permissions-Policy header', () => {
      const response = middleware(mockRequest)

      const permissions = mockNextResponse.headers.get('Permissions-Policy')
      expect(permissions).toContain('camera=()')
      expect(permissions).toContain('microphone=()')
      expect(permissions).toContain('geolocation=()')
    })

    it('should set cross-origin isolation headers', () => {
      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
      expect(mockNextResponse.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
      expect(mockNextResponse.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp')
    })
  })

  describe('Development vs Production CSP', () => {
    it('should include unsafe-inline and unsafe-eval in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const response = middleware(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain("'unsafe-inline'")
      expect(csp).toContain("'unsafe-eval'")
    })

    it('should not include unsafe-inline and unsafe-eval in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      const response = middleware(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      expect(csp).not.toContain("'unsafe-inline'")
      expect(csp).not.toContain("'unsafe-eval'")
    })

    it('should include report-uri in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const response = middleware(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain('report-uri /api/csp-report')
    })

    it('should not include report-uri in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      const response = middleware(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      expect(csp).not.toContain('report-uri')
    })
  })

  describe('Request Path Filtering', () => {
    it('should skip CSP for static files', () => {
      Object.defineProperty(mockRequest, 'nextUrl', {
        value: {
          pathname: '/static/styles.css',
        },
      })

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('Content-Security-Policy')).toBeNull()
    })

    it('should process non-static files with CSP', () => {
      Object.defineProperty(mockRequest, 'nextUrl', {
        value: {
          pathname: '/berita',
        },
      })

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('Content-Security-Policy')).toBeDefined()
    })

    it('should not modify API routes', () => {
      Object.defineProperty(mockRequest, 'nextUrl', {
        value: {
          pathname: '/api/posts',
        },
      })

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-nonce')).toBeNull()
    })

    it('should not modify _next internal routes', () => {
      Object.defineProperty(mockRequest, 'nextUrl', {
        value: {
          pathname: '/_next/static/chunks/main.js',
        },
      })

      const response = middleware(mockRequest)

      expect(mockNextResponse.headers.get('x-nonce')).toBeNull()
    })
  })

  describe('Configuration', () => {
    it('should export config with matcher', () => {
      expect(middlewareConfig).toBeDefined()
      expect(middlewareConfig.matcher).toBeDefined()
      expect(Array.isArray(middlewareConfig.matcher)).toBe(true)
    })
  })

  describe('Request Coalescing', () => {
    it('should handle multiple concurrent requests', async () => {
      const responses = await Promise.all([
        middleware(mockRequest),
        middleware(mockRequest),
        middleware(mockRequest),
      ])

      responses.forEach((response) => {
        expect(response).toBeDefined()
      })
    })
  })
})