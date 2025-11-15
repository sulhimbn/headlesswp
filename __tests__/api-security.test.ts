import { APISecurity, defaultSecurityConfig, apiSecurity } from '@/lib/api-security'
import { NextRequest } from 'next/server'

// Mock NextRequest
const createMockRequest = (overrides: Partial<NextRequest> = {}): NextRequest => {
  const defaultRequest = {
    ip: '192.168.1.1',
    headers: new Map([
      ['x-forwarded-for', '192.168.1.1'],
      ['user-agent', 'test-agent']
    ]),
    method: 'GET',
    url: 'http://localhost:3000/api/test'
  } as unknown as NextRequest

  return { ...defaultRequest, ...overrides }
}

describe('APISecurity', () => {
  let security: APISecurity
  const testConfig = {
    ...defaultSecurityConfig,
    rateLimit: {
      windowMs: 1000, // 1 second for testing
      maxRequests: 2,
      message: 'Rate limit exceeded for testing'
    }
  }

  beforeEach(() => {
    security = new APISecurity(testConfig)
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const request = createMockRequest()
      
      const result1 = security.validateRequest(request)
      expect(result1.allowed).toBe(true)
      
      const result2 = security.validateRequest(request)
      expect(result2.allowed).toBe(true)
    })

    it('should block requests exceeding rate limit', () => {
      const request = createMockRequest()
      
      // First two requests should be allowed
      security.validateRequest(request)
      security.validateRequest(request)
      
      // Third request should be blocked
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(false)
      expect(result.status).toBe(429)
      expect(result.message).toBe('Rate limit exceeded for testing')
      expect(result.headers).toHaveProperty('Retry-After')
    })

    it('should include rate limit headers in successful responses', () => {
      const request = createMockRequest()
      const result = security.validateRequest(request)
      
      expect(result.allowed).toBe(true)
      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '2')
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining')
      expect(result.headers).toHaveProperty('X-RateLimit-Reset')
    })

    it('should reset rate limit after window expires', async () => {
      const request = createMockRequest()
      
      // Exhaust rate limit
      security.validateRequest(request)
      security.validateRequest(request)
      const blockedResult = security.validateRequest(request)
      expect(blockedResult.allowed).toBe(false)
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should be allowed again
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(true)
    })
  })

  describe('CORS Validation', () => {
    it('should allow requests from allowed origins', () => {
      const request = createMockRequest({
        headers: new Map([
          ['origin', 'http://localhost:3000'],
          ['user-agent', 'test-agent']
        ])
      })
      
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(true)
    })

    it('should block requests from disallowed origins', () => {
      const request = createMockRequest({
        headers: new Map([
          ['origin', 'https://malicious-site.com'],
          ['user-agent', 'test-agent']
        ])
      })
      
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(false)
      expect(result.status).toBe(403)
      expect(result.message).toBe('Origin not allowed')
    })

    it('should handle requests without origin header', () => {
      const request = createMockRequest({
        headers: new Map([
          ['user-agent', 'test-agent']
        ])
      })
      
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(true)
    })
  })

  describe('API Key Authentication', () => {
    const authConfig = {
      ...testConfig,
      enableAuth: true,
      apiKeys: ['valid-key-1', 'valid-key-2']
    }

    beforeEach(() => {
      security = new APISecurity(authConfig)
    })

    it('should allow requests with valid API key', () => {
      const request = createMockRequest({
        headers: new Map([
          ['x-api-key', 'valid-key-1'],
          ['user-agent', 'test-agent']
        ])
      })
      
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(true)
    })

    it('should block requests without API key when auth is enabled', () => {
      const request = createMockRequest({
        headers: new Map([
          ['user-agent', 'test-agent']
        ])
      })
      
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(false)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Invalid or missing API key')
    })

    it('should block requests with invalid API key', () => {
      const request = createMockRequest({
        headers: new Map([
          ['x-api-key', 'invalid-key'],
          ['user-agent', 'test-agent']
        ])
      })
      
      const result = security.validateRequest(request)
      expect(result.allowed).toBe(false)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Invalid or missing API key')
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize dangerous input', () => {
      const dangerousInput = '<script>alert("xss")</script>'
      const sanitized = security.sanitizeInput(dangerousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).not.toContain('javascript:')
    })

    it('should handle non-string input', () => {
      expect(security.sanitizeInput(null as any)).toBe('')
      expect(security.sanitizeInput(undefined as any)).toBe('')
      expect(security.sanitizeInput(123 as any)).toBe('')
    })

    it('should preserve safe input', () => {
      const safeInput = 'Hello, World!'
      const sanitized = security.sanitizeInput(safeInput)
      
      expect(sanitized).toBe(safeInput)
    })
  })

  describe('API Path Validation', () => {
    it('should allow valid API paths', () => {
      const validPaths = [
        '/wp-json/wp/v2/posts',
        '/wp-json/wp/v2/categories',
        '/wp-json/wp/v2/tags',
        '/api/csp-report'
      ]

      validPaths.forEach(path => {
        expect(security.validateAPIPath(path)).toBe(true)
      })
    })

    it('should block invalid API paths', () => {
      const invalidPaths = [
        '/wp-json/wp/v2/users', // Should be blocked by default
        '/admin/config',
        '/api/secret-endpoint',
        '/wp-json/unknown/v1/data'
      ]

      invalidPaths.forEach(path => {
        expect(security.validateAPIPath(path)).toBe(false)
      })
    })
  })

  describe('CORS Headers', () => {
    it('should return correct CORS headers for allowed origins', () => {
      const headers = security.getCORSHeaders('http://localhost:3000')
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-API-Key')
    })

    it('should handle wildcard origins', () => {
      const wildcardConfig = {
        ...testConfig,
        allowedOrigins: ['*']
      }
      const wildcardSecurity = new APISecurity(wildcardConfig)
      
      const headers = wildcardSecurity.getCORSHeaders('https://any-site.com')
      expect(headers['Access-Control-Allow-Origin']).toBe('*')
    })
  })

  describe('Client IP Detection', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        headers: new Map([
          ['x-forwarded-for', '203.0.113.1, 192.168.1.1'],
          ['user-agent', 'test-agent']
        ])
      })
      
      // Access private method through type assertion for testing
      const securityAny = security as any
      const ip = securityAny.getClientIP(request)
      expect(ip).toBe('203.0.113.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = createMockRequest({
        headers: new Map([
          ['x-real-ip', '203.0.113.2'],
          ['user-agent', 'test-agent']
        ])
      })
      
      const securityAny = security as any
      const ip = securityAny.getClientIP(request)
      expect(ip).toBe('203.0.113.2')
    })

    it('should fall back to request IP', () => {
      const request = createMockRequest({
        ip: '203.0.113.3',
        headers: new Map([
          ['user-agent', 'test-agent']
        ])
      })
      
      const securityAny = security as any
      const ip = securityAny.getClientIP(request)
      expect(ip).toBe('203.0.113.3')
    })
  })
})

describe('Default API Security Instance', () => {
  it('should create default security instance', () => {
    expect(apiSecurity).toBeInstanceOf(APISecurity)
  })

  it('should use environment variables for configuration', () => {
    // This test verifies that the default configuration is properly structured
    expect(defaultSecurityConfig.rateLimit.windowMs).toBe(900000) // 15 minutes
    expect(defaultSecurityConfig.rateLimit.maxRequests).toBe(100)
    expect(defaultSecurityConfig.allowedOrigins).toContain('http://localhost:3000')
    expect(defaultSecurityConfig.allowedOrigins).toContain('https://mitrabantennews.com')
  })
})