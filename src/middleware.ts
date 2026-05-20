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

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 60
const RATE_LIMIT_WINDOW_MS = 60 * 1000

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
  const clientKey = getClientKey(request)
  const now = Date.now()

  let clientData = rateLimitMap.get(clientKey)

  if (!clientData || now > clientData.resetTime) {
    clientData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS }
    rateLimitMap.set(clientKey, clientData)
  }

  clientData.count++
  const remaining = Math.max(0, RATE_LIMIT_MAX - clientData.count)

  const allowed = clientData.count <= RATE_LIMIT_MAX

  return { allowed, remaining, resetTime: clientData.resetTime }
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
    response.headers.set('X-SE0-Crawler', 'bot')
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SE0-Crawler', 'human')
  }
}

function setRateLimitHeaders(response: NextResponse, remaining: number, resetTime: number): void {
  response.headers.set('X-RateLimit-Policy', '60;w=60')
  response.headers.set('X-RateLimit-Limit', '60')
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isBot = isBotUserAgent(request.headers.get('user-agent'))

  const { allowed, remaining, resetTime } = checkRateLimit(request)

  const response = NextResponse.next()

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response, remaining, resetTime)
  setPrefetchHints(response)

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307)
  }

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}