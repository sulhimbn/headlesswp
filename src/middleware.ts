import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'screaming frog',
]

const CACHE_CONTROL_DYNAMIC = 'public, s-maxage=60, stale-while-revalidate=300'
// Reserved for future use with static assets
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CACHE_CONTROL_STATIC = 'public, max-age=31536000, immutable'
// Reserved for future use with no-cache responses
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CACHE_CONTROL_NONE = 'no-cache, no-store, must-revalidate'

// Reserved for future cache key generation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateCacheKey = (path: string): string => {
  return `request:${path}`
}

const requestCache = new Map<string, { promise: Promise<NextResponse>, timestamp: number }>()
const REQUEST_COALESCING_WINDOW = 100

const isBotRequest = (userAgent: string): boolean => {
  const lowerUserAgent = userAgent.toLowerCase()
  return BOT_USER_AGENTS.some(bot => lowerUserAgent.includes(bot.toLowerCase()))
}

const getGeoFromHeader = (request: NextRequest): string | null => {
  return request.headers.get('x-vercel-ip-country') || null
}

const getETag = (content: string): string => {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `"${hash.toString(16)}"`
}

const shouldCoalesceRequest = (path: string): boolean => {
  return path.startsWith('/api/') && !path.includes('cache') && !path.includes('health')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next()
  }

  const requestCoalescingKey = pathname + request.headers.get('x-search-params') || ''
  
  if (shouldCoalesceRequest(pathname)) {
    const existingRequest = requestCache.get(requestCoalescingKey)
    const now = Date.now()

    if (existingRequest && (now - existingRequest.timestamp) < REQUEST_COALESCING_WINDOW) {
      return NextResponse.next({
        headers: {
          'x-coalesced': 'true',
        },
      })
    }

    const responsePromise = NextResponse.next()
    requestCache.set(requestCoalescingKey, {
      promise: Promise.resolve(responsePromise),
      timestamp: now,
    })

    setTimeout(() => {
      requestCache.delete(requestCoalescingKey)
    }, REQUEST_COALESCING_WINDOW * 2)
  }

  const response = NextResponse.next()

  response.headers.set('X-Request-Id', crypto.randomUUID())
  response.headers.set('X-Content-Type-Options', 'nosniff')

  if (pathname === '/') {
    response.headers.set('Cache-Control', CACHE_CONTROL_DYNAMIC)
  } else if (pathname.startsWith('/berita') || pathname.startsWith('/kategori') || pathname.startsWith('/tag')) {
    response.headers.set('Cache-Control', CACHE_CONTROL_DYNAMIC)
  }

  const userAgent = request.headers.get('user-agent') || ''
  if (isBotRequest(userAgent)) {
    response.headers.set('X-Crawler-Friendly', 'true')
    
    if (pathname.startsWith('/berita/')) {
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
    }
  }

  const geo = getGeoFromHeader(request)
  if (geo) {
    response.headers.set('X-Geo-Country', geo)
  }

  const lastModified = request.headers.get('if-modified-since')
  if (lastModified) {
    const clientTime = new Date(lastModified).getTime()
    const serverTime = Date.now()
    
    if (clientTime >= serverTime) {
      return new NextResponse(null, {
        status: 304,
        headers: response.headers,
      })
    }
  }

  if (pathname.endsWith('.html') || pathname.endsWith('.json')) {
    response.headers.set('ETag', getETag(pathname))
    response.headers.set('Last-Modified', new Date().toUTCString())
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api/health|api/health/readiness|api/observability|api/rss|api/cache|_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
}