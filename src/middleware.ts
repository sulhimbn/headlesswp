import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, SITE_URL_WWW } from '@/lib/api/config'
import { generateNonce } from '@/lib/utils/cspUtils'

const BOT_USER_AGENTS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /applebot/i,
  /spotify/i,
  /linkedinbot/i,
  /telegrambot/i,
  /discordbot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /rogerbot/i,
  /screaming frog/i,
]

const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.json',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]

interface RequestCoalescingEntry {
  timestamp: number
  resolve: (response: NextResponse) => void
  reject: (error: Error) => void
}

const pendingRequests: Map<string, RequestCoalescingEntry[]> = new Map()

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_USER_AGENTS.some((pattern) => pattern.test(userAgent))
}

function getCacheKey(request: NextRequest): string {
  const url = request.nextUrl
  return `${url.pathname}${url.search || ''}`
}

function normalizeAcceptLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null
  const primary = acceptLanguage.split(',')[0]
  const [lang] = primary.split('-')
  return lang?.toLowerCase() || null
}

function extractGeoFromHeaders(request: NextRequest): Record<string, string> {
  const geo: Record<string, string> = {}
  const cfCountry = request.headers.get('cf-ipcountry')
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  const vercelCity = request.headers.get('x-vercel-ip-city')
  const vercelRegion = request.headers.get('x-vercel-ip-country-region')
  
  if (cfCountry) geo.country = cfCountry
  if (vercelCountry) geo.country = vercelCountry
  if (vercelCity) geo.city = vercelCity
  if (vercelRegion) geo.region = vercelRegion
  
  return geo
}

function generateCoalescingKey(request: NextRequest): string {
  return getCacheKey(request)
}

async function coalesceRequests(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const key = generateCoalescingKey(request)
  
  const existing = pendingRequests.get(key)
  if (existing && existing.length > 0) {
    return new Promise<NextResponse>((resolve) => {
      existing.push({
        timestamp: Date.now(),
        resolve: resolve as (response: NextResponse) => void,
        reject: () => {},
      })
    })
  }
  
  const newEntries: RequestCoalescingEntry[] = []
  pendingRequests.set(key, newEntries)
  
  const response = await handler()
  
  const entries = pendingRequests.get(key) || []
  entries.forEach((entry) => {
    const newResponse = NextResponse.next()
    response.headers.forEach((value, header) => {
      newResponse.headers.set(header, value)
    })
    entry.resolve(newResponse)
  })
  pendingRequests.delete(key)
  
  return response
}

function generateETag(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `"${Math.abs(hash).toString(16)}"`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isStaticFile = STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  const isApiRoute = pathname.startsWith('/api')
  const isNextInternal = pathname.startsWith('/_next')
  
  const shouldHandle =
    !isApiRoute && !isNextInternal && !pathname.includes('favicon.ico')

  if (!shouldHandle) {
    return NextResponse.next()
  }

  let response: NextResponse

  const processRequest = async (): Promise<NextResponse> => {
    const innerResponse = NextResponse.next()
    
    const nonce = generateNonce()
    innerResponse.headers.set('x-nonce', nonce)
    
    const userAgent = request.headers.get('user-agent')
    const isBot = isBotUserAgent(userAgent)
    innerResponse.headers.set('x-is-bot', isBot ? '1' : '0')
    
    const acceptLanguage = request.headers.get('accept-language')
    const normalizedLang = normalizeAcceptLanguage(acceptLanguage)
    if (normalizedLang) {
      innerResponse.headers.set('x-accept-language', normalizedLang)
    }
    
    const geo = extractGeoFromHeaders(request)
    if (Object.keys(geo).length > 0) {
      innerResponse.headers.set('x-geo', JSON.stringify(geo))
    }
    
    innerResponse.headers.set('x-request-cache-key', getCacheKey(request))
    innerResponse.headers.set('x-edge-processed', 'true')
    
    if (!isStaticFile) {
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
        ...(isDevelopment ? ['report-uri /api/csp-report'] : []),
      ].join('; ')
      
      innerResponse.headers.set('Content-Security-Policy', csp)
    }
    
    innerResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    innerResponse.headers.set('X-Frame-Options', 'DENY')
    innerResponse.headers.set('X-Content-Type-Options', 'nosniff')
    innerResponse.headers.set('X-XSS-Protection', '1; mode=block')
    innerResponse.headers.set(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    )
    innerResponse.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
    innerResponse.headers.set(
      'Permissions-Policy',
      [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', ')
    )
    
    innerResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    innerResponse.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
    innerResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    
    const now = new Date().toUTCString()
    innerResponse.headers.set('Last-Modified', now)
    
    const etagContent = `${pathname}${now}`
    innerResponse.headers.set('ETag', generateETag(etagContent))
    
    innerResponse.headers.set('X-Cache-Status', 'MISS')
    
    if (isBot) {
      innerResponse.headers.set('X-SEO-Bot', 'true')
    }
    
    return innerResponse
  }

  try {
    response = await coalesceRequests(request, processRequest)
  } catch {
    response = NextResponse.next()
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}