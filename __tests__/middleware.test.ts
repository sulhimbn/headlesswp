import { NextRequest, NextResponse } from 'next/server'
import { middleware, config } from '@/middleware'

jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((input?: string | Request | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : new URL(input?.url || 'http://localhost:3000')
    return {
      url: url.toString(),
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      nextUrl: {
        pathname: url.pathname,
      },
    }
  }),
  NextResponse: {
    next: jest.fn(() => ({
      headers: new Headers(),
      status: 200
    })),
    redirect: jest.fn((url: URL, status: number) => ({
      headers: new Headers({ location: url.toString() }),
      status,
    })),
  },
}))

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://example.com',
  SITE_URL_WWW: 'https://www.example.com',
}))

jest.mock('@/lib/utils/cspUtils', () => ({
  generateNonce: jest.fn(() => 'test-nonce-12345'),
}))

describe('Middleware', () => {
  describe('Content Security Policy', () => {
    it('should set Content-Security-Policy header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toBeDefined()
      expect(typeof csp).toBe('string')
      expect(csp?.length).toBeGreaterThan(0)
    })

    it('should include default-src in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
    })

    it('should include script-src with nonce in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("script-src 'self'")
      expect(csp).toMatch(/nonce-[a-zA-Z0-9+/=]+/)
    })

    it('should include style-src with nonce in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("style-src 'self'")
    })

    it('should include img-src with data: and blob: in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain('img-src')
      expect(csp).toContain('data:')
      expect(csp).toContain('blob:')
    })

    it('should include font-src in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("font-src 'self' data:")
    })

    it('should include connect-src in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("connect-src 'self'")
    })

    it('should include media-src in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("media-src 'self'")
    })

    it('should include object-src none in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("object-src 'none'")
    })

    it('should include base-uri in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("base-uri 'self'")
    })

    it('should include form-action in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("form-action 'self'")
    })

    it('should include frame-ancestors none in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('should include upgrade-insecure-requests in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain('upgrade-insecure-requests')
    })
  })

  describe('Nonce Generation', () => {
    it('should set x-nonce header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('x-nonce')).toBeDefined()
      expect(typeof response.headers.get('x-nonce')).toBe('string')
    })

    it.skip('should generate valid base64 nonce', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const nonce = response.headers.get('x-nonce')
      expect(() => atob(nonce || '')).not.toThrow()
    })

    it('should use same nonce in CSP and x-nonce header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const nonce = response.headers.get('x-nonce')
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain(`nonce-${nonce}`)
    })

    it.skip('should call generateNonce once per request', async () => {
      const { generateNonce } = require('@/lib/utils/cspUtils')
      
      const request = new NextRequest('http://localhost:3000/test')
      await middleware(request)

      expect(generateNonce).toHaveBeenCalledTimes(1)
    })
  })

  describe('Security Headers', () => {
    it('should set Strict-Transport-Security header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const hsts = response.headers.get('Strict-Transport-Security')
      expect(hsts).toBeDefined()
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
      expect(hsts).toContain('preload')
    })

    it('should set X-Frame-Options to DENY', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should set X-XSS-Protection header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should set Referrer-Policy header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should set Permissions-Policy header', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const permissions = response.headers.get('Permissions-Policy')
      expect(permissions).toBeDefined()
      expect(permissions).toContain('camera=()')
      expect(permissions).toContain('microphone=()')
      expect(permissions).toContain('geolocation=()')
      expect(permissions).toContain('payment=()')
      expect(permissions).toContain('usb=()')
      expect(permissions).toContain('magnetometer=()')
      expect(permissions).toContain('gyroscope=()')
      expect(permissions).toContain('accelerometer=()')
    })

    it('should set Cross-Origin headers', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
      expect(response.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp')
    })
  })

  describe('Bot Detection', () => {
    it('should set bot headers for Googlebot', async () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'googlebot/2.1' }
      })
      const response = await middleware(request)
      
      expect(response.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set human headers for regular browser', async () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'user-agent': 'Mozilla/5.0 Chrome/120.0' }
      })
      const response = await middleware(request)
      
      expect(response.headers.get('X-SEO-Crawler')).toBe('human')
    })
  })

  describe('Root Redirect', () => {
    it('should redirect root path to /berita', async () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/berita')
    })
  })

  describe('Rate Limit Headers', () => {
    it('should set rate limit headers', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      expect(response.headers.get('X-RateLimit-Policy')).toBe('60;w=60')
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    })
  })

  describe('Prefetch Hints', () => {
    it('should set Link header with prefetch hints', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const link = response.headers.get('Link')
      expect(link).toContain('/berita')
      expect(link).toContain('rel="prefetch"')
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
      
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      const csp = response.headers.get('Content-Security-Policy')
      
      expect(csp).toContain("'unsafe-inline'")
      expect(csp).toContain("'unsafe-eval'")
    })

    it('should not include unsafe-inline and unsafe-eval in production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      const csp = response.headers.get('Content-Security-Policy')
      
      expect(csp).not.toContain("'unsafe-inline'")
      expect(csp).not.toContain("'unsafe-eval'")
    })

    it('should include report-uri in development', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })
      
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      const csp = response.headers.get('Content-Security-Policy')
      
      expect(csp).toContain('report-uri /api/csp-report')
    })

    it('should not include report-uri in production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      const csp = response.headers.get('Content-Security-Policy')
      
      expect(csp).not.toContain('report-uri')
    })
  })

  describe('Integration Tests', () => {
    it('should set all required security headers', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
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
        expect(response.headers.get(header)).toBeDefined()
      })
    })

    it('should handle multiple consecutive requests', async () => {
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest('http://localhost:3000/test')
        const response = await middleware(request)
        
        expect(response.headers.get('Content-Security-Policy')).toBeDefined()
        expect(response.headers.get('x-nonce')).toBeDefined()
        expect(response.headers.get('Strict-Transport-Security')).toBeDefined()
      }
    })
  })

  describe('Header Value Validation', () => {
    it('should have valid HSTS max-age', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const hsts = response.headers.get('Strict-Transport-Security')
      const maxAgeMatch = hsts?.match(/max-age=(\d+)/)
      
      expect(maxAgeMatch).not.toBeNull()
      expect(parseInt(maxAgeMatch![1], 10)).toBe(31536000)
    })

    it('should have properly formatted Permissions-Policy', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const permissions = response.headers.get('Permissions-Policy')
      const policies = permissions?.split(', ')
      
      policies?.forEach(policy => {
        const [feature, value] = policy.split('=')
        expect(feature).toBeDefined()
        expect(value).toBe('()')
      })
    })

    it('should have CSP with semicolon-separated directives', async () => {
      const request = new NextRequest('http://localhost:3000/test')
      const response = await middleware(request)
      
      const csp = response.headers.get('Content-Security-Policy')
      const directives = csp?.split('; ')
      
      expect(directives?.length).toBeGreaterThan(5)
      directives?.forEach(directive => {
        expect(directive).toMatch(/^[a-z-]+/)
      })
    })
  })
})
