import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}

const RATE_LIMIT_WINDOW = 60
const RATE_LIMIT_MAX_REQUESTS = 100

const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

const BOT_PATTERNS = [
  /bot/i, /spider/i, /crawller/i, /scraper/i, /mediapartners/i,
  /googlebot/i, /bingbot/i, /yandex/i, /duckduckbot/i, /facebookexternalhit/i,
  /twitterbot/i, /slackbot/i, /telegrambot/i, /applebot/i, /semrush/i,
]

const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Download-Options': 'noopen',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
}

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent))
}

function cleanOldEntries(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW * 1000) {
      rateLimitStore.delete(key)
    }
  }
}

function checkRateLimit(clientIP: string): boolean {
  cleanOldEntries()
  
  const now = Date.now()
  const entry = rateLimitStore.get(clientIP)
  
  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW * 1000) {
    rateLimitStore.set(clientIP, { count: 1, timestamp: now })
    return true
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') ?? ''
  const clientIP = getClientIP(request)

  const response = NextResponse.next()

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(clientIP)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(RATE_LIMIT_WINDOW),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
        },
      })
    }

    const remaining = rateLimitStore.get(clientIP)
    if (remaining) {
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
      response.headers.set('X-RateLimit-Remaining', String(RATE_LIMIT_MAX_REQUESTS - remaining.count))
    }
  }

  if (isBot(userAgent)) {
    response.headers.set('X-Bot-Detected', 'true')
  }

  return response
}