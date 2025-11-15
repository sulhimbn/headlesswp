import { NextRequest, NextResponse } from 'next/server'
import { apiSecurity } from '@/lib/api-security'

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    const corsHeaders = apiSecurity.getCORSHeaders(origin || '')
    
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  // Validate API requests
  const validation = apiSecurity.validateRequest(request)
  if (!validation.allowed) {
    const errorResponse = new NextResponse(
      JSON.stringify({ error: validation.message }),
      {
        status: validation.status || 403,
        headers: {
          'Content-Type': 'application/json',
          ...validation.headers
        }
      }
    )
    return errorResponse
  }

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
  
  // Add rate limit headers
  if (validation.headers) {
    Object.entries(validation.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  // Add CORS headers for allowed origins
  const origin = request.headers.get('origin')
  if (origin) {
    const corsHeaders = apiSecurity.getCORSHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: We now include API routes to apply security middleware
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}