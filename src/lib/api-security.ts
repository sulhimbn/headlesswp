import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

interface SecurityConfig {
  rateLimit: RateLimitConfig
  allowedOrigins: string[]
  apiKeys: string[]
  enableAuth: boolean
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    this.cleanup()
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime: number; count: number } {
    const now = Date.now()
    let entry = this.store.get(identifier)

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      this.store.set(identifier, entry)
      return { allowed: true, resetTime: entry.resetTime, count: entry.count }
    }

    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime, count: entry.count }
    }

    entry.count++
    return { allowed: true, resetTime: entry.resetTime, count: entry.count }
  }

  private cleanup(): void {
    setInterval(() => {
      const now = Date.now()
      this.store.forEach((entry, key) => {
        if (now > entry.resetTime) {
          this.store.delete(key)
        }
      })
    }, this.config.windowMs)
  }
}

export class APISecurity {
  private rateLimiter: RateLimiter
  private config: SecurityConfig

  constructor(config: SecurityConfig) {
    this.config = config
    this.rateLimiter = new RateLimiter(config.rateLimit)
  }

  validateRequest(request: NextRequest): {
    allowed: boolean
    status?: number
    message?: string
    headers?: Record<string, string>
  } {
    const clientIP = this.getClientIP(request)
    const origin = request.headers.get('origin')
    const apiKey = request.headers.get('x-api-key')

    // Check rate limiting
    const rateLimitResult = this.rateLimiter.isAllowed(clientIP)
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        status: 429,
        message: this.config.rateLimit.message || 'Too many requests',
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': this.config.rateLimit.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    }

    // Check CORS
    if (origin && !this.isOriginAllowed(origin)) {
      return {
        allowed: false,
        status: 403,
        message: 'Origin not allowed'
      }
    }

    // Check API key authentication if enabled
    if (this.config.enableAuth && !this.isValidApiKey(apiKey)) {
      return {
        allowed: false,
        status: 401,
        message: 'Invalid or missing API key'
      }
    }

    // Add rate limit headers to successful responses
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': this.config.rateLimit.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.config.rateLimit.maxRequests - rateLimitResult.count).toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    }
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.ip

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIP) {
      return realIP
    }
    return clientIP || 'unknown'
  }

  private isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.includes('*') || 
           this.config.allowedOrigins.includes(origin)
  }

  private isValidApiKey(apiKey: string | null): boolean {
    if (!apiKey) return false
    return this.config.apiKeys.includes(apiKey)
  }

  getCORSHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400'
    }

    if (this.config.allowedOrigins.includes('*')) {
      headers['Access-Control-Allow-Origin'] = '*'
    } else if (origin && this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
    }

    return headers
  }

  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return ''
    
    // Remove potentially dangerous characters and patterns
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/alert\s*\(/gi, '')
      .replace(/eval\s*\(/gi, '')
      .trim()
  }

  validateAPIPath(path: string): boolean {
    // Only allow specific API paths
    const allowedPaths = [
      '/api/csp-report',
      '/wp-json/wp/v2/posts',
      '/wp-json/wp/v2/categories',
      '/wp-json/wp/v2/tags',
      '/wp-json/wp/v2/media',
      '/wp-json/wp/v2/search'
    ]

    // Allow the exact paths and their sub-paths
    return allowedPaths.some(allowedPath => {
      if (path === allowedPath) return true
      if (path.startsWith(allowedPath + '/')) return true
      return false
    })
  }
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  allowedOrigins: [
    'http://localhost:3000',
    'https://mitrabantennews.com',
    'https://www.mitrabantennews.com'
  ],
  apiKeys: process.env.API_KEYS?.split(',') || [],
  enableAuth: process.env.API_AUTH_ENABLED === 'true'
}

// Create default security instance
export const apiSecurity = new APISecurity(defaultSecurityConfig)