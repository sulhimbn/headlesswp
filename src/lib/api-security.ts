import { NextRequest } from 'next/server';

// Rate limiting store (in-memory for single instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_CONFIGS = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // stricter limit for API routes
  },
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // very strict for auth endpoints
  },
};

// API Keys (in production, use proper secret management)
const API_KEYS = (process.env.API_KEYS || '').split(',').filter(key => key.length > 0);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limiting function
 */
export function rateLimit(
  identifier: string,
  config: keyof typeof RATE_LIMIT_CONFIGS = 'default'
): RateLimitResult {
  const rateConfig = RATE_LIMIT_CONFIGS[config];
  const now = Date.now();
  const key = `${identifier}:${config}`;

  // Clean up expired entries
  if (rateLimitStore.has(key)) {
    const entry = rateLimitStore.get(key)!;
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Get or create entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + rateConfig.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= rateConfig.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      limit: rateConfig.max,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  
  return {
    success: true,
    limit: rateConfig.max,
    remaining: rateConfig.max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to request IP
  return request.ip || 'unknown';
}

/**
 * Validate API key from request
 */
export function validateApiKey(request: NextRequest): boolean {
  // Skip API key validation if no keys are configured
  if (API_KEYS.length === 0 || (API_KEYS.length === 1 && API_KEYS[0] === '')) {
    return true;
  }

  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
  
  return API_KEYS.includes(apiKey || '');
}

/**
 * Validate request origin for CORS
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://mitrabantennews.com',
    'https://www.mitrabantennews.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ];

  // Allow requests without origin (mobile apps, curl, etc.)
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Sanitize and validate request data
 */
export function sanitizeInput(data: any): any {
  if (typeof data !== 'object' || data === null) {
if (typeof data === 'string') {
      // Basic XSS prevention
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/\s+on\w+\s*=/gi, '');
    }
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }

  const sanitized = Object.create(null);
  
  for (const key of Object.keys(data)) {
    // Remove potentially dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    sanitized[key] = sanitizeInput(data[key]);
  }

  return sanitized;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}