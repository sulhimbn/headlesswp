import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Generate a simple nonce for inline scripts and styles
  // Using a simple random string generator that works in Edge Runtime
  const nonce = generateNonce()
  
  // Set nonce in headers for client components to use
  response.headers.set('x-nonce', nonce)
  
  // Enhanced CSP with nonce for dynamic content
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://mitrabantennews.com https://www.mitrabantennews.com`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://mitrabantennews.com https://www.mitrabantennews.com`,
    "img-src 'self' data: blob: https://mitrabantennews.com https://www.mitrabantennews.com",
    "font-src 'self' data:",
    "connect-src 'self' https://mitrabantennews.com https://www.mitrabantennews.com",
    "media-src 'self' https://mitrabantennews.com https://www.mitrabantennews.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    // Report violations in development
    ...(process.env.NODE_ENV === 'development' ? [
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

// Simple nonce generator that works in Edge Runtime
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  
  // Convert Uint8Array to string without spread operator
  let result = ''
  for (let i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i])
  }
  return btoa(result)
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