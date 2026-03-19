import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, SITE_URL_WWW } from './lib/api/config'
import { generateNonce } from './lib/utils/cspUtils'

const BOT_PATTERNS: (string | RegExp)[] = [
  /^googlebot/i,
  /^bingbot/i,
  /^slurp/i,
  /^duckduckbot/i,
  /^baiduspider/i,
  /^yandexbot/i,
  /^facebookexternalhit/i,
  /^twitterbot/i,
  /^linkedinbot/i,
  /^whatsapp/i,
  /^telegram/i,
  /^slack/i,
  /^discordbot/i,
  /^applebot/i,
  /^yahoo/i,
  /crawler/i,
  /spider/i,
  /robot/i,
  /^semrush/i,
  /^ahrefs/i,
  /^moz\//i,
  /^screamingfrog/i,
]

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_PATTERNS.some(bot => {
    if (typeof bot === 'string') {
      return userAgent.toLowerCase().includes(bot.toLowerCase())
    }
    return bot.test(userAgent)
  })
}

const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.avif', '.mp4', '.webm', '.ogg', '.zip', '.gz']

function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.some((ext: string) => pathname.toLowerCase().endsWith(ext))
}

function getEdgeCachingStrategy(pathname: string, isBotRequest: boolean): string {
  if (isStaticAsset(pathname)) {
    return 'public, max-age=31536000, immutable'
  }
  
  if (isBotRequest) {
    return 'public, s-maxage=300, stale-while-revalidate=600, must-revalidate'
  }
  
  if (pathname.startsWith('/berita/')) {
    return 'public, s-maxage=3600, stale-while-revalidate=7200'
  }
  
  if (pathname.startsWith('/cari/')) {
    return 'no-store, no-cache, must-revalidate'
  }
  
  if (pathname === '/' || pathname.startsWith('/berita')) {
    return 'public, s-maxage=300, stale-while-revalidate=600'
  }
  
  return 'public, s-maxage=60, stale-while-revalidate=120'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent')
  const isBotRequest = isBot(userAgent)
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const response = NextResponse.next()
  
  const nonce = generateNonce()
  
  response.headers.set('x-nonce', nonce)
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
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
    ...(isDevelopment ? ['report-uri /api/csp-report'] : [])
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
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
  
  const cacheStrategy = getEdgeCachingStrategy(pathname, isBotRequest)
  response.headers.set('Cache-Control', cacheStrategy)
  
  if (isBotRequest) {
    response.headers.set('X-Bot-Detected', 'true')
    response.headers.set('Vary', 'User-Agent')
  }
  
  response.headers.set('Accept-CH', 'Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
