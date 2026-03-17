import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const responseHeaders = new Headers(response.headers)
  
  responseHeaders.set('X-Edge-Runtime', '1')
  
  if (!responseHeaders.has('X-Content-Type-Options')) {
    responseHeaders.set('X-Content-Type-Options', 'nosniff')
  }

  if (!responseHeaders.has('X-Frame-Options')) {
    responseHeaders.set('X-Frame-Options', 'DENY')
  }

  if (!responseHeaders.has('X-XSS-Protection')) {
    responseHeaders.set('X-XSS-Protection', '1; mode=block')
  }

  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    responseHeaders.set('Vary', 'Accept-Language')
  }

  const cacheControl = determineCacheControl(request.nextUrl.pathname)
  responseHeaders.set('Cache-Control', cacheControl)

  return new NextResponse(null, {
    headers: responseHeaders,
  })
}

function determineCacheControl(pathname: string): string {
  if (pathname.startsWith('/api/')) {
    return 'no-cache, no-store, must-revalidate'
  }

  if (pathname === '/' || pathname === '/berita') {
    return 'public, max-age=300, stale-while-revalidate=600'
  }

  if (pathname.startsWith('/berita/')) {
    return 'public, max-age=3600, stale-while-revalidate=86400'
  }

  if (pathname.startsWith('/kategori/') || pathname.startsWith('/tag/') || pathname.startsWith('/author/')) {
    return 'public, max-age=600, stale-while-revalidate=1800'
  }

  return 'public, max-age=60, stale-while-revalidate=300'
}