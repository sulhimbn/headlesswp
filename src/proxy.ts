import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, SITE_URL_WWW } from './lib/api/config'
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
  response.headers.set('X-RateLimit-Policy', '60;w=60')
  response.headers.set('X-RateLimit-Limit', '60')
  response.headers.set('X-RateLimit-Remaining', '59')
  response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 60000).toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = NextResponse.next()

  response.headers.set('X-DNS-Prefetch-Control', 'on')
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response)
  setPrefetchHints(response)

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307)
  }

  return proxy(request)
}

export function proxy(_request: NextRequest) {
  const response = NextResponse.next()
  
  const nonce = generateNonce()
  
  response.headers.set('x-nonce', nonce)
  
  // Enhanced CSP with nonce for dynamic content
  // In production, unsafe-inline and unsafe-eval are removed for better security
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
    // Report violations in development
    ...(isDevelopment ? [
      `report-uri /api/csp-report`
    ] : [])
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Additional security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
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

  // Cross-origin isolation headers
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}