import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, SITE_URL_WWW, MIDDLEWARE_RATE_LIMIT } from './lib/api/config'
import { generateNonce } from './lib/utils/cspUtils'

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
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
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

function setRateLimitHeaders(response: NextResponse): void {
  const { MAX_REQUESTS, WINDOW_SECONDS } = MIDDLEWARE_RATE_LIMIT
  const windowMs = WINDOW_SECONDS * 1000
  response.headers.set('X-RateLimit-Policy', `${MAX_REQUESTS};w=${WINDOW_SECONDS}`)
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - 1).toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / windowMs).toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

function setPermissionsPolicy(response: NextResponse): void {
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '))
}

function setCrossOriginHeaders(response: NextResponse): void {
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
}

function setCSPHeaders(response: NextResponse, nonce: string): void {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDevelopment ? " 'unsafe-inline' 'unsafe-eval'" : ''} ${SITE_URL} ${SITE_URL_WWW}`,
    `style-src 'self' 'nonce-${nonce}'${isDevelopment ? " 'unsafe-inline'" : ''} ${SITE_URL} ${SITE_URL_WWW}`,
    `img-src 'self' data: blob: ${SITE_URL} ${SITE_URL_WWW}`,
    "font-src 'self' data:",
    `connect-src 'self' ${SITE_URL} ${SITE_URL_WWW}`,
    `media-src 'self' ${SITE_URL} ${SITE_URL_WWW}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    ...(isDevelopment ? [`report-uri /api/csp-report`] : [])
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = NextResponse.next()

  const nonce = generateNonce()

  setCSPHeaders(response, nonce)
  setSecurityHeaders(response)
  setPermissionsPolicy(response)
  setCrossOriginHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response)
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