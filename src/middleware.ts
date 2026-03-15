import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, SITE_URL_WWW } from './lib/api/config'
import { generateNonce } from './lib/utils/cspUtils'

const BOT_USER_AGENTS = [
  /bot/i, /spider/i, /crawl/i, /slurp/i, /mediapartners/i, /googlebot/i,
  /bingbot/i, /yandex/i, /baiduspider/i, /facebookexternalhit/i, /twitterbot/i,
  /rogerbot/i, /linkedinbot/i, /embedly/i, /quora link preview/i, /showyoubot/i,
  /outbrain/i, /pinterest/i, /applebot/i, /duckduckbot/i, /sogou/i,
  /exabot/i, /ia_archiver/i, /applebot/i, /facebookcatalog/i
]

const BOT_CACHE_TTL = 60 * 60 * 1000
const USER_CACHE_TTL = 5 * 60 * 1000

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_USER_AGENTS.some(botPattern => botPattern.test(userAgent))
}

function getCountryFromRequest(request: NextRequest): string | null {
  const countryHeaders = [
    'x-vercel-ip-country',
    'x-country-code',
    'cf-ipcountry',
    'x-geo-country'
  ]
  
  for (const header of countryHeaders) {
    const country = request.headers.get(header)
    if (country) return country
  }
  
  return null
}

function getRegionFromRequest(request: NextRequest): string | null {
  const regionHeaders = [
    'x-vercel-id',
    'cf-ray'
  ]
  
  for (const header of regionHeaders) {
    const value = request.headers.get(header)
    if (value) {
      const parts = value.split('::')
      if (parts.length > 1) return parts[1].split('-')[0]
    }
  }
  
  return null
}

function getRequestTimingHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  
  const startTime = request.headers.get('x-request-start')
  if (startTime) {
    headers['x-response-time'] = Date.now().toString()
  }
  
  headers['x-middleware-start'] = Date.now().toString()
  
  return headers
}

function generateSecurityHeaders(
  request: NextRequest,
  nonce: string,
  response: NextResponse
): void {
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
}

function addBotDetectionHeaders(
  request: NextRequest,
  response: NextResponse
): void {
  const userAgent = request.headers.get('user-agent')
  const isBot = isBotUserAgent(userAgent)
  
  response.headers.set('x-is-bot', isBot.toString())
  response.headers.set('x-cache-ttl', isBot ? BOT_CACHE_TTL.toString() : USER_CACHE_TTL.toString())
  response.headers.set('x-cache-mode', isBot ? 'bot' : 'user')
  
  if (isBot && userAgent) {
    const botPattern = BOT_USER_AGENTS.find(p => p.test(userAgent))
    if (botPattern) {
      const match = userAgent.match(botPattern)
      if (match) {
        response.headers.set('x-bot-type', match[0])
      }
    }
  }
}

function addGeoRoutingHints(
  request: NextRequest,
  response: NextResponse
): void {
  const country = getCountryFromRequest(request)
  const region = getRegionFromRequest(request)
  
  if (country) {
    response.headers.set('x-geo-country', country)
  }
  
  if (region) {
    response.headers.set('x-geo-region', region)
  }
  
  const colo = request.headers.get('x-vercel-id')?.split('::')[0]
  if (colo) {
    response.headers.set('x-edge-location', colo)
  }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const nonce = generateNonce()
  response.headers.set('x-nonce', nonce)
  
  generateSecurityHeaders(request, nonce, response)
  
  addBotDetectionHeaders(request, response)
  
  addGeoRoutingHints(request, response)
  
  const timingHeaders = getRequestTimingHeaders(request)
  Object.entries(timingHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  response.headers.set('x-middleware-tracking', 'enabled')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
