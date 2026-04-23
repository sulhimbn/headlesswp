import { middleware as securityMiddleware, isBotUserAgent } from '@/middleware'

let mockSecurityHeaders: Record<string, string> = {}
let mockRequestHeaders: Map<string, string>

const createMockNextResponse = () => ({
  headers: {
    get: (key: string) => mockSecurityHeaders[key] || null,
    set: (key: string, value: string) => {
      mockSecurityHeaders[key] = value
    }
  },
  status: 200
})

jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation(() => ({
    url: 'http://localhost:3000/test',
    method: 'GET',
    headers: mockRequestHeaders,
    nextUrl: {
      pathname: '/test'
    }
  })),
  NextResponse: {
    next: jest.fn(() => createMockNextResponse()),
    redirect: jest.fn(() => createMockNextResponse())
  }
}))

describe('Security Middleware (middleware.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSecurityHeaders = {}
    mockRequestHeaders = new Map()
  })

  describe('isBotUserAgent', () => {
    it('should return false for null user agent', () => {
      expect(isBotUserAgent(null)).toBe(false)
    })

    it('should return false for undefined user agent', () => {
      expect(isBotUserAgent(undefined as unknown as string | null)).toBe(false)
    })

    it('should return true for Googlebot', () => {
      expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true)
    })

    it('should return true for Bingbot', () => {
      expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true)
    })

    it('should return true for Yandex', () => {
      expect(isBotUserAgent('Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)')).toBe(true)
    })

    it('should return true for DuckDuckBot', () => {
      expect(isBotUserAgent('DuckDuckBot/1.0; +http://duckduckgo.com/duckduckbot.html')).toBe(true)
    })

    it('should return true for Baidu Spider', () => {
      expect(isBotUserAgent('Baiduspider/2.0 (+http://www.baidu.com/search/spider.html)')).toBe(true)
    })

    it('should return true for Facebook external hit', () => {
      expect(isBotUserAgent('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true)
    })

    it('should return true for Twitterbot', () => {
      expect(isBotUserAgent('Twitterbot/1.0')).toBe(true)
    })

    it('should return true for LinkedInBot', () => {
      expect(isBotUserAgent('LinkedInBot/1.0; http://www.linkedin.com/apps')).toBe(true)
    })

    it('should return true for WhatsApp', () => {
      expect(isBotUserAgent('WhatsApp/1.0')).toBe(true)
    })

    it('should return true for TelegramBot', () => {
      expect(isBotUserAgent('TelegramBot')).toBe(true)
    })

    it('should return true for SlackBot', () => {
      expect(isBotUserAgent('Slackbot/1.0')).toBe(true)
    })

    it('should return true for AppleBot', () => {
      expect(isBotUserAgent('Applebot/1.0')).toBe(true)
    })

    it('should return true for GPTBot', () => {
      expect(isBotUserAgent('GPTBot/1.0')).toBe(true)
    })

    it('should return true for ClaudeBot', () => {
      expect(isBotUserAgent('ClaudeBot/1.0')).toBe(true)
    })

    it('should return true for Anthropic AI', () => {
      expect(isBotUserAgent('Anthropic-AI/1.0')).toBe(true)
    })

    it('should return true for CCBot', () => {
      expect(isBotUserAgent('CCBot/2.0')).toBe(true)
    })

    it('should return true for Cohere AI', () => {
      expect(isBotUserAgent('cohere-ai/1.0')).toBe(true)
    })

    it('should return false for regular Chrome browser', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false)
    })

    it('should return false for regular Firefox browser', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0')).toBe(false)
    })

    it('should return false for Safari browser', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15')).toBe(false)
    })

    it('should return false for curl', () => {
      expect(isBotUserAgent('curl/7.81.0')).toBe(false)
    })

    it('should return false for wget', () => {
      expect(isBotUserAgent('Wget/1.21.3')).toBe(false)
    })
  })

  describe('Security Headers', () => {
    it('should set X-DNS-Prefetch-Control header', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-DNS-Prefetch-Control']).toBe('on')
    })

    it('should set X-Frame-Options to DENY', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-Frame-Options']).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-Content-Type-Options']).toBe('nosniff')
    })

    it('should set Referrer-Policy header', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('Bot Detection Headers', () => {
    it('should set bot headers for bot user agent', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Googlebot/2.1']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-Robots-Tag']).toBe('index, follow')
      expect(mockSecurityHeaders['X-SEO-Crawler']).toBe('bot')
    })

    it('should set human headers for regular browser', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-Robots-Tag']).toBe('index, follow')
      expect(mockSecurityHeaders['X-SEO-Crawler']).toBe('human')
    })

    it('should set human headers when no user agent', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map()
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-SEO-Crawler']).toBe('human')
    })
  })

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Policy header', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-RateLimit-Policy']).toBe('60;w=60')
    })

    it('should set X-RateLimit-Limit header', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-RateLimit-Limit']).toBe('60')
    })

    it('should set X-RateLimit-Remaining header', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-RateLimit-Remaining']).toBe('59')
    })

    it('should set X-RateLimit-Reset header', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['X-RateLimit-Reset']).toBeDefined()
      expect(parseInt(mockSecurityHeaders['X-RateLimit-Reset'], 10)).toBeGreaterThan(0)
    })
  })

  describe('Prefetch Hints', () => {
    it('should set Link header with prefetch', async () => {
      const { NextRequest } = require('next/server')
      mockRequestHeaders = new Map([['user-agent', 'Mozilla/5.0']])
      const request = new NextRequest()

      await securityMiddleware(request)

      expect(mockSecurityHeaders['Link']).toContain('prefetch')
      expect(mockSecurityHeaders['Link']).toContain('/berita')
      expect(mockSecurityHeaders['Link']).toContain('/kategori')
      expect(mockSecurityHeaders['Link']).toContain('/tag')
      expect(mockSecurityHeaders['Link']).toContain('/author')
      expect(mockSecurityHeaders['Link']).toContain('/cari')
    })
  })
})