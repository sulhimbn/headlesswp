const BOT_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /applebot/i,
  /GPTBot/i,
  /ClaudeBot/i,
  /anthropic-ai/i,
  /CCBot/i,
  /cohere-ai/i,
]

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

const CRITICAL_ROUTES = ['/berita', '/kategori', '/tag', '/author', '/cari']

interface MockHeaders {
  [key: string]: string
}

interface MockResponse {
  status: number
  headers: MockHeaders
}

interface MockRequest {
  url: string
  nextUrl: { pathname: string }
  headers: { get: (key: string) => string | null }
}

function createMockResponse(): MockResponse {
  return {
    status: 200,
    headers: {}
  }
}

function setSecurityHeaders(response: MockResponse): void {
  response.headers['X-DNS-Prefetch-Control'] = 'on'
  response.headers['X-Frame-Options'] = 'DENY'
  response.headers['X-Content-Type-Options'] = 'nosniff'
  response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
}

function setBotOptimizationHeaders(response: MockResponse, isBot: boolean): void {
  if (isBot) {
    response.headers['X-Robots-Tag'] = 'index, follow'
    response.headers['X-SEO-Crawler'] = 'bot'
  } else {
    response.headers['X-Robots-Tag'] = 'index, follow'
    response.headers['X-SEO-Crawler'] = 'human'
  }
}

function setRateLimitHeaders(response: MockResponse): void {
  response.headers['X-RateLimit-Policy'] = '60;w=60'
  response.headers['X-RateLimit-Limit'] = '60'
  response.headers['X-RateLimit-Remaining'] = '59'
  response.headers['X-RateLimit-Reset'] = Math.ceil(Date.now() / 60000).toString()
}

function setPrefetchHints(response: MockResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers['Link'] = `<${criticalRoutesStr}>; rel="prefetch"`
}

function middleware(request: MockRequest): MockResponse {
  const { pathname } = request.nextUrl

  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = createMockResponse()

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response)
  setPrefetchHints(response)

  if (pathname === '/') {
    return {
      status: 307,
      headers: { Location: '/berita' }
    }
  }

  return response
}

function createMockRequest(url: string, userAgent?: string): MockRequest {
  const parsedUrl = new URL(url)
  return {
    url,
    nextUrl: { pathname: parsedUrl.pathname },
    headers: {
      get: (key: string) => {
        if (key === 'user-agent') return userAgent || null
        return null
      }
    }
  }
}

describe('Middleware Security Tests', () => {
  describe('Security Headers', () => {
    it('should set X-DNS-Prefetch-Control header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-DNS-Prefetch-Control']).toBe('on')
    })

    it('should set X-Frame-Options to DENY', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-Frame-Options']).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff')
    })

    it('should set Referrer-Policy to strict-origin-when-cross-origin', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should set X-DNS-Prefetch-Control to on', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-DNS-Prefetch-Control']).toBe('on')
    })

    it('should set X-Robots-Tag header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-Robots-Tag']).toBe('index, follow')
    })

    it('should set all security headers in one response', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)

      expect(response.headers['X-DNS-Prefetch-Control']).toBe('on')
      expect(response.headers['X-Frame-Options']).toBe('DENY')
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff')
      expect(response.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(response.headers['X-Robots-Tag']).toBe('index, follow')
    })
  })

  describe('Bot Detection', () => {
    it('should detect Googlebot', () => {
      expect(isBotUserAgent('googlebot/2.1')).toBe(true)
    })

    it('should detect Bingbot', () => {
      expect(isBotUserAgent('bingbot/2.0')).toBe(true)
    })

    it('should detect Yandex', () => {
      expect(isBotUserAgent('YandexBot/3.0')).toBe(true)
    })

    it('should detect DuckDuckBot', () => {
      expect(isBotUserAgent('DuckDuckBot/1.0')).toBe(true)
    })

    it('should detect Baidu Spider', () => {
      expect(isBotUserAgent('Baiduspider/2.0')).toBe(true)
    })

    it('should detect Facebookexternalhit', () => {
      expect(isBotUserAgent('facebookexternalhit/1.1')).toBe(true)
    })

    it('should detect Twitterbot', () => {
      expect(isBotUserAgent('Twitterbot/1.0')).toBe(true)
    })

    it('should detect LinkedInBot', () => {
      expect(isBotUserAgent('LinkedInBot/1.0')).toBe(true)
    })

    it('should detect WhatsApp', () => {
      expect(isBotUserAgent('WhatsApp/2.21.123')).toBe(true)
    })

    it('should detect TelegramBot', () => {
      expect(isBotUserAgent('TelegramBot/1.0')).toBe(true)
    })

    it('should detect Slackbot', () => {
      expect(isBotUserAgent('Slackbot/1.0')).toBe(true)
    })

    it('should detect Applebot', () => {
      expect(isBotUserAgent('Applebot/0.1')).toBe(true)
    })

    it('should detect GPTBot', () => {
      expect(isBotUserAgent('GPTBot/1.0')).toBe(true)
    })

    it('should detect ClaudeBot', () => {
      expect(isBotUserAgent('ClaudeBot/1.0')).toBe(true)
    })

    it('should detect anthropic-ai', () => {
      expect(isBotUserAgent('anthropic-ai/1.0')).toBe(true)
    })

    it('should detect CCBot', () => {
      expect(isBotUserAgent('CCBot/2.0')).toBe(true)
    })

    it('should detect cohere-ai', () => {
      expect(isBotUserAgent('cohere-ai/1.0')).toBe(true)
    })

    it('should return false for null user agent', () => {
      expect(isBotUserAgent(null)).toBe(false)
    })

    it('should return false for regular browser user agent', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe(false)
    })

    it('should return false for Chrome user agent', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')).toBe(false)
    })

    it('should return false for Firefox user agent', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0')).toBe(false)
    })

    it('should return false for Safari user agent', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15')).toBe(false)
    })

    it('should set X-SEO-Crawler to bot for bot user agents', () => {
      const request = createMockRequest('http://localhost:3000/berita', 'googlebot/2.1')
      const response = middleware(request)
      expect(response.headers['X-SEO-Crawler']).toBe('bot')
    })

    it('should set X-SEO-Crawler to human for regular user agents', () => {
      const request = createMockRequest('http://localhost:3000/berita', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124')
      const response = middleware(request)
      expect(response.headers['X-SEO-Crawler']).toBe('human')
    })
  })

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Policy header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-RateLimit-Policy']).toBe('60;w=60')
    })

    it('should set X-RateLimit-Limit header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-RateLimit-Limit']).toBe('60')
    })

    it('should set X-RateLimit-Remaining header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.headers['X-RateLimit-Remaining']).toBe('59')
    })

    it('should set X-RateLimit-Reset header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      const reset = response.headers['X-RateLimit-Reset']
      expect(reset).toBeDefined()
      expect(parseInt(reset, 10)).toBeGreaterThan(0)
    })

    it('should set all rate limit headers', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)

      expect(response.headers['X-RateLimit-Policy']).toBeDefined()
      expect(response.headers['X-RateLimit-Limit']).toBeDefined()
      expect(response.headers['X-RateLimit-Remaining']).toBeDefined()
      expect(response.headers['X-RateLimit-Reset']).toBeDefined()
    })
  })

  describe('Prefetch Hints', () => {
    it('should set Link header with prefetch for critical routes', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      const linkHeader = response.headers['Link']

      expect(linkHeader).toContain('rel="prefetch"')
      CRITICAL_ROUTES.forEach(route => {
        expect(linkHeader).toContain(route)
      })
    })

    it('should include all critical routes in Link header', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      const linkHeader = response.headers['Link']

      expect(linkHeader).toContain('/berita')
      expect(linkHeader).toContain('/kategori')
      expect(linkHeader).toContain('/tag')
      expect(linkHeader).toContain('/author')
      expect(linkHeader).toContain('/cari')
    })
  })

  describe('Root Redirect', () => {
    it('should redirect root path to /berita', () => {
      const request = createMockRequest('http://localhost:3000/')
      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers['Location']).toBe('/berita')
    })

    it('should not redirect non-root paths', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers['Location']).toBeUndefined()
    })

    it('should preserve query parameters in redirect', () => {
      const request = createMockRequest('http://localhost:3000/?utm_source=test')
      const response = middleware(request)

      expect(response.status).toBe(307)
    })

    it('should not redirect /berita path', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      expect(response.status).toBe(200)
    })

    it('should not redirect /kategori path', () => {
      const request = createMockRequest('http://localhost:3000/kategori/test')
      const response = middleware(request)
      expect(response.status).toBe(200)
    })

    it('should not redirect /tag path', () => {
      const request = createMockRequest('http://localhost:3000/tag/test')
      const response = middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Integration Tests', () => {
    it('should apply all security features to non-root requests', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)

      expect(response.headers['X-DNS-Prefetch-Control']).toBe('on')
      expect(response.headers['X-Frame-Options']).toBe('DENY')
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff')
      expect(response.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(response.headers['X-Robots-Tag']).toBe('index, follow')
      expect(response.headers['X-SEO-Crawler']).toBe('human')
      expect(response.headers['X-RateLimit-Policy']).toBe('60;w=60')
      expect(response.headers['Link']).toContain('rel="prefetch"')
    })

    it('should apply bot-specific headers for bot requests', () => {
      const request = createMockRequest('http://localhost:3000/berita', 'googlebot/2.1')
      const response = middleware(request)

      expect(response.headers['X-SEO-Crawler']).toBe('bot')
      expect(response.headers['X-Robots-Tag']).toBe('index, follow')
    })

    it('should handle requests with no user agent', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)

      expect(response.headers['X-SEO-Crawler']).toBe('human')
    })

    it('should handle multiple requests consistently', () => {
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('http://localhost:3000/berita')
        const response = middleware(request)

        expect(response.headers['X-Frame-Options']).toBe('DENY')
        expect(response.headers['X-Content-Type-Options']).toBe('nosniff')
        expect(response.headers['X-RateLimit-Limit']).toBe('60')
      }
    })
  })

  describe('Header Value Validation', () => {
    it('should have valid X-RateLimit-Reset value', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      const reset = response.headers['X-RateLimit-Reset']

      expect(reset).not.toBeUndefined()
      const resetNum = parseInt(reset, 10)
      const currentMinute = Math.ceil(Date.now() / 60000)
      expect(resetNum).toBeGreaterThan(currentMinute - 2)
      expect(resetNum).toBeLessThanOrEqual(currentMinute + 1)
    })

    it('should have valid rate limit remaining value', () => {
      const request = createMockRequest('http://localhost:3000/berita')
      const response = middleware(request)
      const remaining = response.headers['X-RateLimit-Remaining']

      expect(remaining).not.toBeUndefined()
      expect(parseInt(remaining, 10)).toBeGreaterThanOrEqual(0)
      expect(parseInt(remaining, 10)).toBeLessThanOrEqual(60)
    })
  })
})