/**
 * Middleware Security Tests
 *
 * Tests for security headers, bot detection, redirect behavior, and matcher patterns.
 */

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

const CRITICAL_ROUTES = ['/berita', '/kategori', '/tag', '/author', '/cari']

function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

interface MockHeaders {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
  entries: () => IterableIterator<[string, string]>
}

interface MockResponse {
  headers: MockHeaders
  status?: number
  url?: string
}

function createMockResponse(): MockResponse {
  const headerMap = new Map<string, string>()
  return {
    headers: {
      get: (key: string) => headerMap.get(key) ?? null,
      set: (key: string, value: string) => headerMap.set(key, value),
      entries: () => headerMap.entries(),
    },
  }
}

function setSecurityHeaders(response: MockResponse): void {
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

function setBotOptimizationHeaders(response: MockResponse, isBot: boolean): void {
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'bot')
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'human')
  }
}

function setPrefetchHints(response: MockResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

interface MiddlewareResult {
  response: MockResponse
  isRedirect: boolean
  redirectUrl?: string
}

function middlewareLogic(pathname: string, userAgent: string | null | undefined): MiddlewareResult {
  const isBot = isBotUserAgent(userAgent)
  const response = createMockResponse()

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setPrefetchHints(response)

  if (pathname === '/') {
    return {
      response,
      isRedirect: true,
      redirectUrl: '/berita',
    }
  }

  return { response, isRedirect: false }
}

const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}

describe('Middleware Security Tests', () => {
  describe('isBotUserAgent', () => {
    const botUserAgents = [
      { ua: 'Googlebot/2.1 (+http://www.google.com/bot.html)', name: 'Googlebot' },
      { ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', name: 'Bingbot' },
      { ua: 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)', name: 'Yandex' },
      { ua: 'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)', name: 'DuckDuckBot' },
      { ua: 'Baiduspider/2.0; (+http://www.baidu.com/search/spider.html)', name: 'Baiduspider' },
      { ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', name: 'Facebook' },
      { ua: 'Twitterbot/1.0', name: 'Twitterbot' },
      { ua: 'LinkedInBot/1.0 (compatible; LinkedIn-Developer; https://dev.linkedin.com)', name: 'LinkedIn' },
      { ua: 'WhatsApp/2.21.0', name: 'WhatsApp' },
      { ua: 'TelegramBot (like TwitterBot)', name: 'TelegramBot' },
      { ua: 'Slackbot/1.0 (+https://api.slack.com/robots)', name: 'Slackbot' },
      { ua: 'Applebot/1.0', name: 'Applebot' },
      { ua: 'GPTBot/1.0 (+https://openai.com/gptbot)', name: 'GPTBot' },
      { ua: 'ClaudeBot/2.0', name: 'ClaudeBot' },
      { ua: 'Anthropic-AI/2.0', name: 'Anthropic AI' },
      { ua: 'CCBot/2.0', name: 'CCBot' },
      { ua: 'cohere-ai/1.0', name: 'cohere-ai' },
    ]

    botUserAgents.forEach(({ ua, name }) => {
      test(`detects ${name} as bot`, () => {
        expect(isBotUserAgent(ua)).toBe(true)
      })
    })

    test('detects bot case-insensitively', () => {
      expect(isBotUserAgent('GOOGLEBOT')).toBe(true)
      expect(isBotUserAgent('Bingbot')).toBe(true)
    })

    test('marks regular browser as human', () => {
      expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0')).toBe(false)
    })

    test('handles missing user-agent', () => {
      expect(isBotUserAgent(null)).toBe(false)
      expect(isBotUserAgent(undefined)).toBe(false)
    })

    test('does not match non-bot user agents', () => {
      expect(isBotUserAgent('curl/7.68.0')).toBe(false)
      expect(isBotUserAgent('PostmanRuntime/7.28.0')).toBe(false)
      expect(isBotUserAgent('node-fetch/1.0')).toBe(false)
    })
  })

  describe('Security Headers', () => {
    test('sets X-DNS-Prefetch-Control header', () => {
      const result = middlewareLogic('/berita', null)
      expect(result.response.headers.get('X-DNS-Prefetch-Control')).toBe('on')
    })

    test('sets X-Frame-Options to DENY', () => {
      const result = middlewareLogic('/berita', null)
      expect(result.response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    test('sets X-Content-Type-Options to nosniff', () => {
      const result = middlewareLogic('/berita', null)
      expect(result.response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    test('sets Referrer-Policy to strict-origin-when-cross-origin', () => {
      const result = middlewareLogic('/berita', null)
      expect(result.response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('Bot Optimization Headers', () => {
    test('sets X-SEO-Crawler to bot for bots', () => {
      const result = middlewareLogic('/berita', 'Googlebot/2.1')
      expect(result.response.headers.get('X-SEO-Crawler')).toBe('bot')
    })

    test('sets X-SEO-Crawler to human for browsers', () => {
      const result = middlewareLogic('/berita', 'Mozilla/5.0')
      expect(result.response.headers.get('X-SEO-Crawler')).toBe('human')
    })

    test('sets X-Robots-Tag for all requests', () => {
      const botResult = middlewareLogic('/berita', 'Googlebot/2.1')
      expect(botResult.response.headers.get('X-Robots-Tag')).toBe('index, follow')

      const humanResult = middlewareLogic('/berita', 'Mozilla/5.0')
      expect(humanResult.response.headers.get('X-Robots-Tag')).toBe('index, follow')
    })
  })

  describe('Prefetch Hints', () => {
    test('sets Link header for critical routes', () => {
      const result = middlewareLogic('/berita', null)
      const linkHeader = result.response.headers.get('Link')
      expect(linkHeader).toContain('/berita')
      expect(linkHeader).toContain('/kategori')
      expect(linkHeader).toContain('/tag')
      expect(linkHeader).toContain('/author')
      expect(linkHeader).toContain('/cari')
      expect(linkHeader).toContain('rel="prefetch"')
    })
  })

  describe('Root Redirect', () => {
    test('redirects / to /berita', () => {
      const result = middlewareLogic('/', null)
      expect(result.isRedirect).toBe(true)
      expect(result.redirectUrl).toBe('/berita')
    })

    test('does not redirect non-root paths', () => {
      const result = middlewareLogic('/berita', null)
      expect(result.isRedirect).toBe(false)
      expect(result.redirectUrl).toBeUndefined()
    })

    test('redirects / with bot user-agent', () => {
      const result = middlewareLogic('/', 'Googlebot/2.1')
      expect(result.isRedirect).toBe(true)
      expect(result.redirectUrl).toBe('/berita')
      expect(result.response.headers.get('X-SEO-Crawler')).toBe('bot')
    })
  })

  describe('Matcher Configuration', () => {
    test('matcher is defined', () => {
      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
    })

    test('matcher excludes API routes', () => {
      expect(config.matcher[0]).toContain('api')
    })

    test('matcher excludes static files', () => {
      expect(config.matcher[0]).toContain('_next/static')
      expect(config.matcher[0]).toContain('_next/image')
    })

    test('matcher excludes favicon and manifest', () => {
      expect(config.matcher[0]).toContain('favicon.ico')
      expect(config.matcher[0]).toContain('manifest.json')
    })

    test('matcher excludes service worker', () => {
      expect(config.matcher[0]).toContain('sw.js')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty user-agent', () => {
      const result = middlewareLogic('/berita', '')
      expect(result.response.headers.get('X-SEO-Crawler')).toBe('human')
    })

    test('handles undefined user-agent', () => {
      const result = middlewareLogic('/berita', undefined)
      expect(result.response.headers.get('X-SEO-Crawler')).toBe('human')
    })

    test('handles various URL paths', () => {
      const paths = ['/berita', '/kategori/tech', '/tag/ai', '/author/admin', '/cari?q=test']

      paths.forEach((path) => {
        const result = middlewareLogic(path, null)
        expect(result.response.headers.get('X-DNS-Prefetch-Control')).toBe('on')
        expect(result.response.headers.get('X-Frame-Options')).toBe('DENY')
      })
    })

    test('handles malformed user-agent patterns', () => {
      const malformedUserAgents = ['undefined', 'null', '12345', '<script>alert(1)</script>']

      malformedUserAgents.forEach((ua) => {
        const result = middlewareLogic('/berita', ua)
        expect(result.response.headers.get('X-SEO-Crawler')).toBe('human')
      })
    })

    test('all security headers present on every response', () => {
      const result = middlewareLogic('/berita', null)
      expect(result.response.headers.get('X-DNS-Prefetch-Control')).toBe('on')
      expect(result.response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(result.response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(result.response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(result.response.headers.get('X-Robots-Tag')).toBe('index, follow')
      expect(result.response.headers.get('X-SEO-Crawler')).toBe('human')
      expect(result.response.headers.get('Link')).toContain('rel="prefetch"')
    })
  })
})