import { NextRequest, NextResponse } from 'next/server'

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

const RATE_LIMIT_MAX = 60
const RATE_LIMIT_WINDOW_MS = 60 * 1000

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

setInterval(cleanupExpiredEntries, RATE_LIMIT_WINDOW_MS)

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip
  return ip || 'unknown'
}

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

function setBotOptimizationHeaders(response: NextResponse, isBot: boolean): void {
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'bot')
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'human')
  }
}

function setRateLimitHeaders(response: NextResponse, remaining: number, resetTime: number): void {
  response.headers.set('X-RateLimit-Policy', '60;w=60')
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(clientId)

  if (!entry || entry.resetTime < now) {
    const resetTime = now + RATE_LIMIT_WINDOW_MS
    rateLimitStore.set(clientId, { count: 1, resetTime })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetTime: entry.resetTime }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const clientId = getClientIdentifier(request)
  const { allowed, remaining, resetTime } = checkRateLimit(clientId)

  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = NextResponse.next()

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)

  if (!allowed) {
    response.headers.set('X-RateLimit-Policy', '60;w=60')
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString())
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString())
    return new NextResponse('Too Many Requests', { status: 429, headers: response.headers })
  }

  setRateLimitHeaders(response, remaining, resetTime)
  setPrefetchHints(response)

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}