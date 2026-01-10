import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, SITE_URL_WWW } from './lib/api/config'
import { generateNonce } from './lib/utils/cspUtils'

export function middleware(_request: NextRequest) {
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
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}