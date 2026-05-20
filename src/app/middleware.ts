import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}

function getGeoFromCF(headers: Headers): { country?: string; city?: string } | null {
  try {
    const country = headers.get('cf-ipcountry')
    const city = headers.get('cf-ipcity')
    if (country || city) {
      return { country: country || undefined, city: city || undefined }
    }
  } catch {
    return null
  }
  return null
}

function getEdgeGeo(headers: Headers): { country?: string; region?: string; city?: string } | null {
  const country = headers.get('x-geo-country')
  const region = headers.get('x-geo-region')
  const city = headers.get('x-geo-city')
  
  if (country || region || city) {
    return {
      country: country || undefined,
      region: region || undefined,
      city: city || undefined,
    }
  }
  
  return getGeoFromCF(headers)
}

function addGeoHeaders(request: NextRequest, response: NextResponse): void {
  const geo = getEdgeGeo(request.headers)
  
  if (geo) {
    if (geo.country) {
      response.headers.set('x-country-code', geo.country)
    }
    if (geo.region) {
      response.headers.set('x-region', geo.region)
    }
    if (geo.city) {
      response.headers.set('x-city', geo.city)
    }
  }
}

function addPerformanceHeaders(response: NextResponse, start: number): void {
  const duration = Date.now() - start
  response.headers.set('x-middleware-duration', String(duration))
  response.headers.set('Server-Timing', `middleware;dur=${duration}`)
}

function shouldSkipMiddleware(pathname: string): boolean {
  const skipPatterns = [
    /^\/_next\/static/,
    /^\/_next\/image/,
    /^\/api\//,
    /\.ico$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/,
    /\.woff$/,
    /\.woff2$/,
    /\.ttf$/,
    /\.eot$/,
  ]
  
  return skipPatterns.some(pattern => pattern.test(pathname))
}

function getCacheKey(request: NextRequest): string {
  const url = new URL(request.url)
  const path = url.pathname
  const country = request.headers.get('x-country-code') || 'unknown'
  return `${country}:${path}`
}

function addCacheTag(response: NextResponse, request: NextRequest): void {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  const tags = ['global']
  
  if (pathSegments.length > 0) {
    tags.push(pathSegments[0])
  }
  
  if (url.pathname.startsWith('/berita')) {
    tags.push('posts')
  } else if (url.pathname.startsWith('/kategori')) {
    tags.push('categories')
  } else if (url.pathname.startsWith('/tag')) {
    tags.push('tags')
  } else if (url.pathname.startsWith('/author')) {
    tags.push('authors')
  }
  
  response.headers.set('x-cache-tags', tags.join(','))
}

export function middleware(request: NextRequest): NextResponse {
  const start = Date.now()
  const pathname = request.nextUrl.pathname
  
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }
  
  const response = NextResponse.next()
  
  addGeoHeaders(request, response)
  addPerformanceHeaders(response, start)
  addCacheTag(response, request)
  
  const cacheKey = getCacheKey(request)
  response.headers.set('x-edge-cache-key', cacheKey)
  
  return response
}

export const runtime = 'edge'
export const regions = ['auto']
