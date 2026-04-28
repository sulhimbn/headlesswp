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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307)
  }

  const response = NextResponse.next()
  
  const nonce = generateNonce()
  
  response.headers.set('x-nonce', nonce)
  
  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'bot')
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'human')
  }

  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  let scriptSrc = "script-src 'self' 'nonce-" + nonce + "'"
  if (isDevelopment) {
    scriptSrc += " 'unsafe-inline' 'unsafe-eval'"
  }
  scriptSrc += " " + SITE_URL + " " + SITE_URL_WWW

  let styleSrc = "style-src 'self' 'nonce-" + nonce + "'"
  if (isDevelopment) {
    styleSrc += " 'unsafe-inline'"
  }
  styleSrc += " " + SITE_URL + " " + SITE_URL_WWW

  const csp = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: blob: " + SITE_URL + " " + SITE_URL_WWW,
    "font-src 'self' data:",
    "connect-src 'self' " + SITE_URL + " " + SITE_URL_WWW,
    "media-src 'self' " + SITE_URL + " " + SITE_URL_WWW,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]
  if (isDevelopment) {
    csp.push("report-uri /api/csp-report")
  }
  
  response.headers.set('Content-Security-Policy', csp.join('; '))
  
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

  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}