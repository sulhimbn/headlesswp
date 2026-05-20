import { NextRequest, NextResponse } from 'next/server'
import { middleware, config } from '../middleware'

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}))

describe('Middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockNextResponse: jest.Mocked<NextResponse> & { headers: Headers; status: number }
  let mockRedirectResponse: jest.Mocked<NextResponse>

  beforeEach(() => {
    jest.clearAllMocks()

    mockNextResponse = {
      headers: new Headers(),
      status: 200,
    } as unknown as jest.Mocked<NextResponse> & { headers: Headers; status: number }

    mockRedirectResponse = {
      headers: new Headers(),
      status: 307,
    } as unknown as jest.Mocked<NextResponse>

    mockRequest = {
      nextUrl: {
        pathname: '/test',
      },
      url: 'http://localhost:3000/test',
      headers: new Headers(),
    } as unknown as jest.Mocked<NextRequest>

    ;(NextResponse.next as jest.Mock).mockReturnValue(mockNextResponse)
    ;(NextResponse.redirect as jest.Mock).mockReturnValue(mockRedirectResponse)
  })

  describe('Root Redirect', () => {
    it('should redirect / to /berita', () => {
      mockRequest.nextUrl.pathname = '/'

      middleware(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/berita', 'http://localhost:3000'),
        307
      )
    })

    it('should use 307 temporary redirect status', () => {
      mockRequest.nextUrl.pathname = '/'

      middleware(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.any(URL),
        307
      )
    })

    it('should not redirect non-root paths', () => {
      mockRequest.nextUrl.pathname = '/berita'

      middleware(mockRequest)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Security Headers', () => {
    beforeEach(() => {
      mockRequest.nextUrl.pathname = '/berita'
    })

    it('should set X-DNS-Prefetch-Control header', () => {
      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-DNS-Prefetch-Control')).toBe('on')
    })

    it('should set X-Frame-Options to DENY', () => {
      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', () => {
      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should set Referrer-Policy header', () => {
      middleware(mockRequest)

      expect(mockNextResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('Bot Detection', () => {
    beforeEach(() => {
      mockRequest.nextUrl.pathname = '/berita'
    })

    it('should detect Googlebot', () => {
      mockRequest.headers.set('user-agent', 'Googlebot/2.1 (+http://www.google.com/bot.html)')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
      expect(mockNextResponse.headers.get('X-Robots-Tag')).toBe('index, follow')
    })

    it('should detect Bingbot', () => {
      mockRequest.headers.set('user-agent', 'bingbot/2.0 (+http://www.bing.com/bingbot.htm)')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should detect Yandex bot', () => {
      mockRequest.headers.set('user-agent', 'YandexBot/3.0 (+http://yandex.com/bots)')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should detect Facebook external hit', () => {
      mockRequest.headers.set('user-agent', 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should detect Twitter bot', () => {
      mockRequest.headers.set('user-agent', 'Twitterbot/1.0')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should detect AI bots (GPTBot, ClaudeBot)', () => {
      mockRequest.headers.set('user-agent', 'GPTBot/1.0 (+https://openai.com/gptbot)')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should detect Claude bot', () => {
      mockRequest.headers.set('user-agent', 'ClaudeBot/1.0 (+https://anthropic.com/claude-bot)')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    it('should mark human users correctly', () => {
      mockRequest.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('human')
      expect(mockNextResponse.headers.get('X-Robots-Tag')).toBe('index, follow')
    })

    it('should handle missing user-agent', () => {
      mockRequest.headers.delete('user-agent')

      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-SEO-Crawler')).toBe('human')
    })
  })

  describe('Rate Limiting Headers', () => {
    beforeEach(() => {
      mockRequest.nextUrl.pathname = '/berita'
    })

    it('should set X-RateLimit-Policy header', () => {
      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-RateLimit-Policy')).toBe('60;w=60')
    })

    it('should set X-RateLimit-Limit header', () => {
      middleware(mockRequest)

      expect(mockNextResponse.headers.get('X-RateLimit-Limit')).toBe('60')
    })

    it('should set X-RateLimit-Remaining header', () => {
      middleware(mockRequest)

      const remaining = mockNextResponse.headers.get('X-RateLimit-Remaining')
      expect(remaining).toBeDefined()
      expect(parseInt(remaining!, 10)).toBeGreaterThanOrEqual(0)
    })

    it('should set X-RateLimit-Reset header', () => {
      middleware(mockRequest)

      const reset = mockNextResponse.headers.get('X-RateLimit-Reset')
      expect(reset).toBeDefined()
      expect(parseInt(reset!, 10)).toBeGreaterThan(0)
    })
  })

  describe('Prefetch Hints', () => {
    beforeEach(() => {
      mockRequest.nextUrl.pathname = '/berita'
    })

    it('should set Link header for prefetch', () => {
      middleware(mockRequest)

      const link = mockNextResponse.headers.get('Link')
      expect(link).toBeDefined()
      expect(link).toContain('/berita')
      expect(link).toContain('/kategori')
      expect(link).toContain('/tag')
    })

    it('should include all critical routes in prefetch hints', () => {
      middleware(mockRequest)

      const link = mockNextResponse.headers.get('Link')
      const criticalRoutes = ['/berita', '/kategori', '/tag', '/author', '/cari']

      criticalRoutes.forEach((route) => {
        expect(link).toContain(route)
      })
    })

    it('should set prefetch rel attribute', () => {
      middleware(mockRequest)

      const link = mockNextResponse.headers.get('Link')
      expect(link).toContain('rel="prefetch"')
    })
  })

  describe('Integration Tests', () => {
    it('should set all headers on regular request', () => {
      mockRequest.nextUrl.pathname = '/berita'
      mockRequest.headers.set('user-agent', 'Mozilla/5.0')

      middleware(mockRequest)

      const securityHeaders = [
        'X-DNS-Prefetch-Control',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
      ]
      const botHeaders = ['X-SEO-Crawler', 'X-Robots-Tag']
      const rateLimitHeaders = ['X-RateLimit-Policy', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
      const prefetchHeaders = ['Link']

      ;[...securityHeaders, ...botHeaders, ...rateLimitHeaders, ...prefetchHeaders].forEach((header) => {
        expect(mockNextResponse.headers.get(header)).toBeDefined()
      })
    })

    it('should handle root path with bot user agent', () => {
      mockRequest.nextUrl.pathname = '/'
      mockRequest.headers.set('user-agent', 'Googlebot/2.1')

      middleware(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalled()
    })

    it('should handle various page paths', () => {
      const paths = ['/berita', '/kategori/news', '/tag/politics', '/author/1', '/cari']

      paths.forEach((path) => {
        jest.clearAllMocks()
        mockRequest.nextUrl.pathname = path
        mockRequest.headers.set('user-agent', 'Mozilla/5.0')

        middleware(mockRequest)

        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
      })
    })
  })

  describe('Config Object', () => {
    it('should export config with matcher property', () => {
      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
    })

    it('should have matcher array', () => {
      expect(Array.isArray(config.matcher)).toBe(true)
      expect(config.matcher.length).toBeGreaterThan(0)
    })

    it('should exclude API routes', () => {
      expect(config.matcher[0]).toContain('api')
    })

    it('should exclude static files', () => {
      expect(config.matcher[0]).toContain('_next/static')
    })

    it('should exclude image optimization', () => {
      expect(config.matcher[0]).toContain('_next/image')
    })

    it('should exclude favicon', () => {
      expect(config.matcher[0]).toContain('favicon.ico')
    })

    it('should exclude manifest.json', () => {
      expect(config.matcher[0]).toContain('manifest.json')
    })

    it('should exclude service worker', () => {
      expect(config.matcher[0]).toContain('sw.js')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty pathname', () => {
      mockRequest.nextUrl.pathname = ''

      middleware(mockRequest)

      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('should handle deeply nested paths', () => {
      mockRequest.nextUrl.pathname = '/kategori/news/2024/01/15'

      middleware(mockRequest)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(mockNextResponse.headers.get('Link')).toContain('/kategori')
    })

    it('should preserve URL in redirect', () => {
      mockRequest.nextUrl.pathname = '/'
      Object.defineProperty(mockRequest, 'url', {
        value: 'https://mitrabantennews.com/',
        writable: true,
      })

      middleware(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/berita', 'https://mitrabantennews.com'),
        307
      )
    })
  })
})
