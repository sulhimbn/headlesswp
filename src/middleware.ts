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

const GLOBAL_RATE_LIMIT = 60
const GLOBAL_RATE_LIMIT_WINDOW = 60 * 1000

interface ClientRateLimit {
  count: number
  windowStart: number
}

const clientRateLimits = new Map<string, ClientRateLimit>()

function getClientId(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip') ?? 'unknown'
}

function checkGlobalRateLimit(request: NextRequest): NextResponse | null {
  const clientId = getClientId(request)
  const now = Date.now()

  let clientState = clientRateLimits.get(clientId)

  if (!clientState || now - clientState.windowStart >= GLOBAL_RATE_LIMIT_WINDOW) {
    clientState = { count: 0, windowStart: now }
    clientRateLimits.set(clientId, clientState)
  }

  clientState.count++

  const remaining = Math.max(0, GLOBAL_RATE_LIMIT - clientState.count)
  const resetTime = Math.ceil((clientState.windowStart + GLOBAL_RATE_LIMIT_WINDOW) / 1000)

  if (clientState.count > GLOBAL_RATE_LIMIT) {
    const response = NextResponse.json(
      { error: { type: 'RATE_LIMIT_ERROR', message: 'Rate limit exceeded' } },
      { status: 429 }
    )
    response.headers.set('X-RateLimit-Limit', GLOBAL_RATE_LIMIT.toString())
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', resetTime.toString())
    response.headers.set('Retry-After', Math.ceil(GLOBAL_RATE_LIMIT_WINDOW / 1000).toString())
    return response
  }

  return null
}

function setRateLimitHeaders(response: NextResponse, remaining: number): void {
  response.headers.set('X-RateLimit-Policy', '60;w=60')
  response.headers.set('X-RateLimit-Limit', GLOBAL_RATE_LIMIT.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 60000).toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const corsResponse = handleCors(request)
    const rateLimitResponse = checkGlobalRateLimit(request)
    if (rateLimitResponse) {
      corsResponse.headers.set('X-RateLimit-Limit', rateLimitResponse.headers.get('X-RateLimit-Limit') ?? '60')
      corsResponse.headers.set('X-RateLimit-Remaining', rateLimitResponse.headers.get('X-RateLimit-Remaining') ?? '59')
      corsResponse.headers.set('X-RateLimit-Reset', rateLimitResponse.headers.get('X-RateLimit-Reset') ?? '0')
      return rateLimitResponse
    }
    setRateLimitHeaders(corsResponse, Math.max(0, GLOBAL_RATE_LIMIT - 1))
    return corsResponse
  }

  const rateLimitResponse = checkGlobalRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = NextResponse.next()

  const clientId = getClientId(request)
  const clientState = clientRateLimits.get(clientId)
  const remaining = clientState ? Math.max(0, GLOBAL_RATE_LIMIT - clientState.count) : GLOBAL_RATE_LIMIT

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response, remaining)
  setPrefetchHints(response)

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307)
  }

  return response
}

function handleCors(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000']
  const isAllowedOrigin = allowedOrigins.includes(origin ?? '') || allowedOrigins.includes('*')

  const response = NextResponse.next()

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin ?? '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}
