import { NextRequest, NextResponse } from 'next/server'
import { proxy, config as proxyConfig } from '@/proxy'

let mockHeaders: Headers

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(() => ({ headers: mockHeaders })),
    redirect: jest.fn(() => ({ headers: mockHeaders })),
  },
}))

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://mitrabantennews.com',
  SITE_URL_WWW: 'https://www.mitrabantennews.com',
}))

jest.mock('@/lib/utils/cspUtils', () => ({
  generateNonce: jest.fn(() => 'test-nonce-12345'),
}))

describe('Proxy Middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockNextResponse: { headers: Headers }
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    jest.clearAllMocks()
    originalEnv = { ...process.env }
    mockHeaders = new Headers()
    mockNextResponse = { headers: mockHeaders }

    mockRequest = {
      url: 'https://mitrabantennews.com/',
      nextUrl: {
        pathname: '/berita',
      },
      headers: new Headers({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }),
    } as unknown as jest.Mocked<NextRequest>
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Nonce Generation', () => {
    it('should generate a nonce for each request', () => {
      proxy(mockRequest)

      expect(mockHeaders.get('x-nonce')).toBe('test-nonce-12345')
    })

    it('should call generateNonce once per request', () => {
      const { generateNonce } = require('@/lib/utils/cspUtils')
      
      proxy(mockRequest)

      expect(generateNonce).toHaveBeenCalledTimes(1)
    })

    it('should set x-nonce header', () => {
      proxy(mockRequest)

      const nonce = mockHeaders.get('x-nonce')
      
      expect(nonce).toBeDefined()
      expect(typeof nonce).toBe('string')
      expect(nonce?.length).toBeGreaterThan(0)
    })
  })

  describe('Content Security Policy (CSP)', () => {
    it('should set Content-Security-Policy header', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy')
      
      expect(csp).toBeDefined()
      expect(typeof csp).toBe('string')
    })

    it('should include default-src self', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("default-src 'self'")
    })

    it('should include script-src with nonce', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("'nonce-test-nonce-12345'")
    })

    it('should include style-src with nonce', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("style-src 'self'")
      expect(csp).toContain("'nonce-test-nonce-12345'")
    })

    it('should include img-src with data and blob', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('img-src')
      expect(csp).toContain('data:')
      expect(csp).toContain('blob:')
    })

    it('should include connect-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("connect-src 'self'")
    })

    it('should include media-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("media-src 'self'")
    })

    it('should set object-src none', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("object-src 'none'")
    })

    it('should include base-uri self', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('base-uri')
      expect(csp).toContain("'self'")
    })

    it('should include form-action self', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('form-action')
      expect(csp).toContain("'self'")
    })

    it('should set frame-ancestors none', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('should include upgrade-insecure-requests', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('upgrade-insecure-requests')
    })

    it('should include nonce in script-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toMatch(/script-src.*'nonce-/)
    })

    it('should include nonce in style-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toMatch(/style-src.*'nonce-/)
    })

    it('should include SITE_URL in script-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL in style-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL in img-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL_WWW in script-src', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://www.mitrabantennews.com')
    })

    it('should include font-src self data', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("font-src 'self'")
      expect(csp).toContain('data:')
    })

    it('should include connect-src with site URLs', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('connect-src')
      expect(csp).toContain('https://mitrabantennews.com')
      expect(csp).toContain('https://www.mitrabantennews.com')
    })

    it('should include media-src with site URLs', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain('media-src')
      expect(csp).toContain('https://mitrabantennews.com')
      expect(csp).toContain('https://www.mitrabantennews.com')
    })
  })

  describe('Development Mode CSP', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should include unsafe-inline in script-src in development', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("'unsafe-inline'")
    })

    it('should include unsafe-eval in script-src in development', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).toContain("'unsafe-eval'")
    })

    it('should include unsafe-inline in style-src in development', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      const styleSrc = csp.split(';').find(s => s.trim().startsWith('style-src'))
      expect(styleSrc).toContain("'unsafe-inline'")
    })
  })

  describe('Production Mode CSP', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should not include unsafe-inline in production', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).not.toMatch(/script-src.*'unsafe-inline'(?!.*'nonce)/)
    })

    it('should not include unsafe-eval in production', () => {
      proxy(mockRequest)

      const csp = mockHeaders.get('Content-Security-Policy') as string
      
      expect(csp).not.toContain("'unsafe-eval'")
    })
  })

  describe('Additional Security Headers', () => {
    it('should set Strict-Transport-Security header', () => {
      proxy(mockRequest)

      const hsts = mockHeaders.get('Strict-Transport-Security')
      
      expect(hsts).toBeDefined()
      expect(hsts).toContain('max-age=')
    })

    it('should set X-Frame-Options to DENY', () => {
      proxy(mockRequest)

      const xfo = mockHeaders.get('X-Frame-Options')
      
      expect(xfo).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', () => {
      proxy(mockRequest)

      const xcto = mockHeaders.get('X-Content-Type-Options')
      
      expect(xcto).toBe('nosniff')
    })

    it('should set X-XSS-Protection', () => {
      proxy(mockRequest)

      const xss = mockHeaders.get('X-XSS-Protection')
      
      expect(xss).toBe('1; mode=block')
    })

    it('should set Referrer-Policy', () => {
      proxy(mockRequest)

      const ref = mockHeaders.get('Referrer-Policy')
      
      expect(ref).toBe('strict-origin-when-cross-origin')
    })

    it('should set X-Permitted-Cross-Domain-Policies', () => {
      proxy(mockRequest)

      const policy = mockHeaders.get('X-Permitted-Cross-Domain-Policies')
      
      expect(policy).toBe('none')
    })

    it('should set Permissions-Policy', () => {
      proxy(mockRequest)

      const policy = mockHeaders.get('Permissions-Policy')
      
      expect(policy).toBeDefined()
      expect(policy).toContain('camera=()')
      expect(policy).toContain('microphone=()')
      expect(policy).toContain('geolocation=()')
    })

    it('should set Cross-Origin-Opener-Policy', () => {
      proxy(mockRequest)

      const policy = mockHeaders.get('Cross-Origin-Opener-Policy')
      
      expect(policy).toBe('same-origin')
    })

    it('should set Cross-Origin-Resource-Policy', () => {
      proxy(mockRequest)

      const policy = mockHeaders.get('Cross-Origin-Resource-Policy')
      
      expect(policy).toBe('same-origin')
    })

    it('should set Cross-Origin-Embedder-Policy', () => {
      proxy(mockRequest)

      const policy = mockHeaders.get('Cross-Origin-Embedder-Policy')
      
      expect(policy).toBe('require-corp')
    })
  })

  describe('Root Redirect', () => {
    it('should redirect root path to /berita', () => {
      const rootRequest = {
        ...mockRequest,
        nextUrl: { pathname: '/' },
      } as unknown as jest.Mocked<NextRequest>

      proxy(rootRequest)

      expect(NextResponse.redirect).toHaveBeenCalled()
    })
  })

  describe('Security Headers from Middleware', () => {
    it('should set X-DNS-Prefetch-Control header', () => {
      proxy(mockRequest)

      const header = mockHeaders.get('X-DNS-Prefetch-Control')
      
      expect(header).toBe('on')
    })

    it('should set X-Robots-Tag header for human', () => {
      proxy(mockRequest)

      const header = mockHeaders.get('X-Robots-Tag')
      
      expect(header).toBe('index, follow')
    })

    it('should set X-SEO-Crawler header for human', () => {
      proxy(mockRequest)

      const header = mockHeaders.get('X-SEO-Crawler')
      
      expect(header).toBe('human')
    })

    it('should set X-RateLimit-Policy header', () => {
      proxy(mockRequest)

      const header = mockHeaders.get('X-RateLimit-Policy')
      
      expect(header).toBe('60;w=60')
    })

    it('should set X-RateLimit-Limit header', () => {
      proxy(mockRequest)

      const header = mockHeaders.get('X-RateLimit-Limit')
      
      expect(header).toBe('60')
    })

    it('should set Link header with prefetch hints', () => {
      proxy(mockRequest)

      const header = mockHeaders.get('Link')
      
      expect(header).toContain('/berita')
      expect(header).toContain('/kategori')
      expect(header).toContain('/tag')
      expect(header).toContain('rel="prefetch"')
    })
  })

  describe('Bot Detection', () => {
    it('should set X-SEO-Crawler to bot for Googlebot', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'Googlebot/2.1' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set X-SEO-Crawler to bot for Bingbot', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'Bingbot/2.0' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set X-SEO-Crawler to bot for Yandex', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'YandexBot/3.0' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set X-SEO-Crawler to bot for Baiduspider', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'Baiduspider' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set X-SEO-Crawler to bot for GPTBot', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'GPTBot' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set X-SEO-Crawler to bot for ClaudeBot', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'ClaudeBot' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should set X-SEO-Crawler to human for Chrome', () => {
      proxy(mockRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('human')
    })

    it('should set X-SEO-Crawler to human for Safari', () => {
      const browserRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'Safari/537.36' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(browserRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('human')
    })

    it('should set X-SEO-Crawler to human for Firefox', () => {
      const browserRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'Firefox/120.0' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(browserRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('human')
    })

    it('should default to human when no user-agent', () => {
      const noUaRequest = {
        ...mockRequest,
        headers: new Headers(),
      } as unknown as jest.Mocked<NextRequest>

      proxy(noUaRequest)

      expect(mockHeaders.get('X-SEO-Crawler')).toBe('human')
    })

    it('should set X-Robots-Tag for bots', () => {
      const botRequest = {
        ...mockRequest,
        headers: new Headers({ 'user-agent': 'Googlebot/2.1' }),
      } as unknown as jest.Mocked<NextRequest>

      proxy(botRequest)

      expect(mockHeaders.get('X-Robots-Tag')).toBe('index, follow')
    })
  })

  describe('Integration', () => {
    it('should set all required headers in one call', () => {
      proxy(mockRequest)

      const headers = Array.from(mockHeaders.keys())
      
      expect(headers).toContain('x-nonce')
      expect(headers).toContain('content-security-policy')
      expect(headers).toContain('strict-transport-security')
      expect(headers).toContain('x-frame-options')
      expect(headers).toContain('x-content-type-options')
      expect(headers).toContain('x-xss-protection')
      expect(headers).toContain('referrer-policy')
      expect(headers).toContain('permissions-policy')
    })

    it('should call NextResponse.next once', () => {
      proxy(mockRequest)

      expect(NextResponse.next).toHaveBeenCalledTimes(1)
    })

    it('should return NextResponse.next result', () => {
      const result = proxy(mockRequest)

      expect(result).toBeDefined()
      expect(result.headers).toBeDefined()
    })

    it('should generate new nonce for each request', () => {
      const { generateNonce } = require('@/lib/utils/cspUtils')
      generateNonce.mockReturnValue('nonce-1')
      proxy(mockRequest)
      
      generateNonce.mockReturnValue('nonce-2')
      proxy(mockRequest)

      const calls = generateNonce.mock.calls
      expect(calls.length).toBe(2)
      expect(mockHeaders.get('x-nonce')).toBe('nonce-2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle request with valid structure', () => {
      expect(() => proxy(mockRequest)).not.toThrow()
      expect(mockHeaders.get('x-nonce')).toBeDefined()
    })

    it('should handle multiple proxy calls', () => {
      proxy(mockRequest)
      proxy(mockRequest)
      proxy(mockRequest)

      expect(NextResponse.next).toHaveBeenCalledTimes(3)
    })
  })

  describe('Config Object', () => {
    it('should export config with matcher property', () => {
      expect(proxyConfig).toBeDefined()
      expect(proxyConfig.matcher).toBeDefined()
    })

    it('should have matcher array with single regex pattern', () => {
      expect(proxyConfig.matcher).toHaveLength(1)
      expect(typeof proxyConfig.matcher[0]).toBe('string')
    })

    it('should exclude API routes in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('api')
    })

    it('should exclude static files in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('_next/static')
    })

    it('should exclude image optimization in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('_next/image')
    })

    it('should exclude favicon in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('favicon.ico')
    })
  })
})