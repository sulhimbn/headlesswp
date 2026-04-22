import { proxy as middleware } from '@/proxy'

let mockHeaders: Record<string, string> = {}

jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string, init?: { headers?: Record<string, string> }) => {
    return {
      url: url || 'http://localhost:3000/test',
      method: 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      nextUrl: {
        pathname: url ? new URL(url).pathname : '/test'
      }
    }
  }),
  NextResponse: {
    next: jest.fn(() => ({
      headers: {
        get: (key: string) => {
          return mockHeaders[key] || null
        },
        set: jest.fn((key: string, value: string) => {
          mockHeaders[key] = value
        })
      },
      status: 200
    })),
    redirect: jest.fn((url: URL, status: number) => ({
      status,
      headers: new Map()
    }))
  }
}))

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders = {}
  })

  describe('Content Security Policy', () => {
    it('should set Content-Security-Policy header', async () => {
      const { NextResponse, NextRequest } = require('next/server')
      const request = new NextRequest()
      
      const response = await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toBeDefined()
      expect(typeof mockHeaders['Content-Security-Policy']).toBe('string')
      expect(mockHeaders['Content-Security-Policy'].length).toBeGreaterThan(0)
    })

    it('should include default-src in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("default-src 'self'")
    })

    it('should include script-src with nonce in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("script-src 'self'")
      expect(mockHeaders['Content-Security-Policy']).toMatch(/nonce-[a-zA-Z0-9+/=]+/)
    })

    it('should include style-src with nonce in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("style-src 'self'")
      expect(mockHeaders['Content-Security-Policy']).toMatch(/style-src 'self' 'nonce-[a-zA-Z0-9+/=]+/)
    })

    it('should include img-src with data: and blob: in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain('img-src')
      expect(mockHeaders['Content-Security-Policy']).toContain('data:')
      expect(mockHeaders['Content-Security-Policy']).toContain('blob:')
    })

    it('should include font-src in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("font-src 'self' data:")
    })

    it('should include connect-src in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("connect-src 'self'")
    })

    it('should include media-src in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("media-src 'self'")
    })

    it('should include object-src none in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("object-src 'none'")
    })

    it('should include base-uri in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("base-uri 'self'")
    })

    it('should include form-action in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("form-action 'self'")
    })

    it('should include frame-ancestors none in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    })

    it('should include upgrade-insecure-requests in CSP', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain('upgrade-insecure-requests')
    })
  })

  describe('Nonce Generation', () => {
    it('should set x-nonce header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['x-nonce']).toBeDefined()
      expect(typeof mockHeaders['x-nonce']).toBe('string')
    })

    it('should generate valid base64 nonce', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      const nonce = mockHeaders['x-nonce']
      expect(() => atob(nonce)).not.toThrow()
    })

    it('should use same nonce in CSP and x-nonce header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      const nonce = mockHeaders['x-nonce']
      expect(mockHeaders['Content-Security-Policy']).toContain(`nonce-${nonce}`)
    })

    it('should generate unique nonces on each request', async () => {
      const { NextRequest } = require('next/server')
      const request1 = new NextRequest()
      const request2 = new NextRequest()
      
      mockHeaders = {}
      await middleware(request1)
      const nonce1 = mockHeaders['x-nonce']
      
      mockHeaders = {}
      await middleware(request2)
      const nonce2 = mockHeaders['x-nonce']
      
      expect(nonce1).not.toBe(nonce2)
    })
  })

  describe('Security Headers', () => {
    it('should set Strict-Transport-Security header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Strict-Transport-Security']).toBeDefined()
      expect(mockHeaders['Strict-Transport-Security']).toContain('max-age=31536000')
      expect(mockHeaders['Strict-Transport-Security']).toContain('includeSubDomains')
      expect(mockHeaders['Strict-Transport-Security']).toContain('preload')
    })

    it('should set X-Frame-Options to DENY', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-Frame-Options']).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-Content-Type-Options']).toBe('nosniff')
    })

    it('should set X-XSS-Protection header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-XSS-Protection']).toBe('1; mode=block')
    })

    it('should set Referrer-Policy header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should set Permissions-Policy header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Permissions-Policy']).toBeDefined()
      expect(mockHeaders['Permissions-Policy']).toContain('camera=()')
      expect(mockHeaders['Permissions-Policy']).toContain('microphone=()')
      expect(mockHeaders['Permissions-Policy']).toContain('geolocation=()')
      expect(mockHeaders['Permissions-Policy']).toContain('payment=()')
      expect(mockHeaders['Permissions-Policy']).toContain('usb=()')
      expect(mockHeaders['Permissions-Policy']).toContain('magnetometer=()')
      expect(mockHeaders['Permissions-Policy']).toContain('gyroscope=()')
      expect(mockHeaders['Permissions-Policy']).toContain('accelerometer=()')
    })
  })

  describe('Development vs Production CSP', () => {
    const originalEnvDescriptor = Object.getOwnPropertyDescriptor(process.env, 'NODE_ENV')

    afterAll(() => {
      if (originalEnvDescriptor) {
        Object.defineProperty(process.env, 'NODE_ENV', originalEnvDescriptor)
      }
    })

    it('should include unsafe-inline and unsafe-eval in development', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })
      
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain("'unsafe-inline'")
      expect(mockHeaders['Content-Security-Policy']).toContain("'unsafe-eval'")
    })

    it('should not include unsafe-inline and unsafe-eval in production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).not.toContain("'unsafe-inline'")
      expect(mockHeaders['Content-Security-Policy']).not.toContain("'unsafe-eval'")
    })

    it('should include report-uri in development', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })
      
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).toContain('report-uri /api/csp-report')
    })

    it('should not include report-uri in production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Content-Security-Policy']).not.toContain('report-uri')
    })
  })

  describe('Integration Tests', () => {
    it('should set all required security headers', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      const requiredHeaders = [
        'Content-Security-Policy',
        'x-nonce',
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy'
      ]
      
      requiredHeaders.forEach(header => {
        expect(mockHeaders[header]).toBeDefined()
      })
    })

    it('should handle multiple consecutive requests', async () => {
      const { NextRequest } = require('next/server')
      
      for (let i = 0; i < 10; i++) {
        mockHeaders = {}
        const request = new NextRequest()
        await middleware(request)
        
        expect(mockHeaders['Content-Security-Policy']).toBeDefined()
        expect(mockHeaders['x-nonce']).toBeDefined()
        expect(mockHeaders['Strict-Transport-Security']).toBeDefined()
      }
    })

    it('should maintain CSP structure across requests', async () => {
      const { NextRequest } = require('next/server')
      
      const cspHeaders: string[] = []
      
      for (let i = 0; i < 5; i++) {
        mockHeaders = {}
        const request = new NextRequest()
        await middleware(request)
        cspHeaders.push(mockHeaders['Content-Security-Policy'])
      }
      
      cspHeaders.forEach(csp => {
        expect(csp).toContain("default-src 'self'")
        expect(csp).toContain("script-src 'self'")
        expect(csp).toContain("style-src 'self'")
        expect(csp).toContain("object-src 'none'")
      })
    })
  })

  describe('Header Value Validation', () => {
    it('should have valid HSTS max-age', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      const hsts = mockHeaders['Strict-Transport-Security']
      const maxAgeMatch = hsts.match(/max-age=(\d+)/)
      
      expect(maxAgeMatch).not.toBeNull()
      expect(parseInt(maxAgeMatch![1], 10)).toBe(31536000)
    })

    it('should have properly formatted Permissions-Policy', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      const permissions = mockHeaders['Permissions-Policy']
      const policies = permissions.split(', ')
      
      policies.forEach(policy => {
        const [feature, value] = policy.split('=')
        expect(feature).toBeDefined()
        expect(value).toBe('()')
      })
    })

    it('should have CSP with semicolon-separated directives', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      const csp = mockHeaders['Content-Security-Policy']
      const directives = csp.split('; ')
      
      expect(directives.length).toBeGreaterThan(5)
      directives.forEach(directive => {
        expect(directive).toMatch(/^[a-z-]+/)
      })
    })
  })

  describe('Additional Security Headers', () => {
    it('should set X-DNS-Prefetch-Control to on', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-DNS-Prefetch-Control']).toBe('on')
    })

    it('should set Cross-Origin-Opener-Policy header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin')
    })

    it('should set Cross-Origin-Resource-Policy header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Cross-Origin-Resource-Policy']).toBe('same-origin')
    })

    it('should set Cross-Origin-Embedder-Policy header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Cross-Origin-Embedder-Policy']).toBe('require-corp')
    })

    it('should set X-Permitted-Cross-Domain-Policies header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-Permitted-Cross-Domain-Policies']).toBe('none')
    })
  })

  describe('Bot Detection Headers', () => {
    it('should set bot detection headers for human users', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-Robots-Tag']).toBe('index, follow')
      expect(mockHeaders['X-SEO-Crawler']).toBe('human')
    })

    it('should set bot detection headers for Googlebot', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'Googlebot/2.1' }
      })
      
      await middleware(request)
      
      expect(mockHeaders['X-Robots-Tag']).toBe('index, follow')
      expect(mockHeaders['X-SEO-Crawler']).toBe('bot')
    })

    it('should set bot detection headers for Bingbot', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'bingbot/2.0' }
      })
      
      await middleware(request)
      
      expect(mockHeaders['X-SEO-Crawler']).toBe('bot')
    })

    it('should set bot detection headers for Facebookexternalhit', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'facebookexternalhit/1.1' }
      })
      
      await middleware(request)
      
      expect(mockHeaders['X-SEO-Crawler']).toBe('bot')
    })

    it('should set bot detection headers for ClaudeBot', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'ClaudeBot/1.0' }
      })
      
      await middleware(request)
      
      expect(mockHeaders['X-SEO-Crawler']).toBe('bot')
    })

    it('should set bot detection headers for GPTBot', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'GPTBot/1.0' }
      })
      
      await middleware(request)
      
      expect(mockHeaders['X-SEO-Crawler']).toBe('bot')
    })
  })

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Policy header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-RateLimit-Policy']).toBeDefined()
      expect(mockHeaders['X-RateLimit-Policy']).toMatch(/\d+;w=\d+/)
    })

    it('should set X-RateLimit-Limit header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-RateLimit-Limit']).toBeDefined()
      expect(parseInt(mockHeaders['X-RateLimit-Limit'], 10)).toBeGreaterThan(0)
    })

    it('should set X-RateLimit-Remaining header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-RateLimit-Remaining']).toBeDefined()
      expect(parseInt(mockHeaders['X-RateLimit-Remaining'], 10)).toBeGreaterThanOrEqual(0)
    })

    it('should set X-RateLimit-Reset header', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['X-RateLimit-Reset']).toBeDefined()
      expect(parseInt(mockHeaders['X-RateLimit-Reset'], 10)).toBeGreaterThan(0)
    })
  })

  describe('Root Redirect', () => {
    it('should redirect root path to /berita', async () => {
      const { NextRequest, NextResponse: MockNextResponse } = require('next/server')
      
      const originalNext = MockNextResponse.next
      
      MockNextResponse.next = jest.fn().mockImplementation(() => {
        return {
          ...originalNext(),
          headers: {
            get: (key: string) => mockHeaders[key] || null,
            set: (key: string, value: string) => { mockHeaders[key] = value }
          }
        } as unknown as typeof MockNextResponse
      })
      
      const redirectHeaders = new Map<string, string>()
      redirectHeaders.get = ((_key: string): string | undefined => undefined) as unknown as (key: string) => string | undefined
      redirectHeaders.set = ((_key: string, _value: string): Map<string, string> => redirectHeaders) as unknown as (key: string, value: string) => Map<string, string>
      
      MockNextResponse.redirect = jest.fn((url: URL, status: number) => {
        return {
          ...originalNext(),
          status,
          headers: redirectHeaders
        } as unknown as typeof MockNextResponse
      })
      
      const request = new NextRequest('http://localhost:3000/')
      await middleware(request)
      
      MockNextResponse.next = originalNext
      
      expect(MockNextResponse.redirect).toHaveBeenCalled()
    })
  })

  describe('Prefetch Hints', () => {
    it('should set Link header with prefetch for critical routes', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Link']).toBeDefined()
      expect(mockHeaders['Link']).toContain('rel="prefetch"')
    })

    it('should include /berita in prefetch hints', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Link']).toContain('/berita')
    })

    it('should include /kategori in prefetch hints', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Link']).toContain('/kategori')
    })

    it('should include /tag in prefetch hints', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Link']).toContain('/tag')
    })

    it('should include /author in prefetch hints', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Link']).toContain('/author')
    })

    it('should include /cari in prefetch hints', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest()
      
      await middleware(request)
      
      expect(mockHeaders['Link']).toContain('/cari')
    })
  })
})
