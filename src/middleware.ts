import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from '@/lib/api/config'

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

interface RateLimitState {
  requestTimes: number[]
}

const rateLimitMap: Map<string, RateLimitState> = new Map()

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now()
  let state = rateLimitMap.get(clientIp)

  if (!state || now - state.requestTimes[0] >= RATE_LIMIT_WINDOW_MS) {
    state = { requestTimes: [] }
    rateLimitMap.set(clientIp, state)
  }

  state.requestTimes = state.requestTimes.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)

  if (state.requestTimes.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestRequest = state.requestTimes[0]
    const waitTime = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return { allowed: false, remaining: 0, resetTime: oldestRequest + RATE_LIMIT_WINDOW_MS, retryAfter: waitTime }
  }

  state.requestTimes.push(now)
  const resetTime = state.requestTimes[0] + RATE_LIMIT_WINDOW_MS

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - state.requestTimes.length, resetTime }
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
  response.headers.set('X-RateLimit-Policy', `${RATE_LIMIT_MAX_REQUESTS};w=${RATE_LIMIT_WINDOW_MS / 1000}`)
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp)

  if (!rateLimitResult.allowed) {
    const errorResponse = NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
    setRateLimitHeaders(errorResponse, rateLimitResult.remaining, rateLimitResult.resetTime)
    if (rateLimitResult.retryAfter) {
      errorResponse.headers.set('Retry-After', rateLimitResult.retryAfter.toString())
    }
    return errorResponse
  }

  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = NextResponse.next()

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response, rateLimitResult.remaining, rateLimitResult.resetTime)
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
