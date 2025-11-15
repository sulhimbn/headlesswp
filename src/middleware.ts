import { NextRequest, NextResponse } from 'next/server'
import { 
  rateLimit, 
  getClientIdentifier, 
  validateApiKey, 
  validateOrigin,
  sanitizeInput 
} from '@/lib/api-security'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get client identifier for rate limiting
  const clientId = getClientIdentifier(request)
  
  // Apply rate limiting based on route type
  let rateLimitType: 'default' | 'api' | 'auth' = 'default'
  
  if (request.nextUrl.pathname.startsWith('/api/')) {
    rateLimitType = 'api'
    
    // Special rate limiting for auth-related endpoints
    if (request.nextUrl.pathname.includes('auth') || 
        request.nextUrl.pathname.includes('login')) {
      rateLimitType = 'auth'
    }
  }
  
  // Check rate limiting
  const rateLimitResult = rateLimit(clientId, rateLimitType)
  
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '',
        },
      }
    )
  }
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
  
  // API security for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Validate API key (skip for CSP report endpoint)
    if (!request.nextUrl.pathname.includes('/api/csp-report')) {
      if (!validateApiKey(request)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Valid API key required',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
    }
    
    // Validate origin for API routes
    if (!validateOrigin(request)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Origin not allowed',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    // Add CORS headers for API routes
    const origin = request.headers.get('origin')
    if (origin && validateOrigin(request)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 })
    }
  }
  
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}