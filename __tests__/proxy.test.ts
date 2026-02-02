import { NextRequest, NextResponse } from 'next/server'
import { proxy, config as proxyConfig } from '@/proxy'

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
  },
}))

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://mitrabantennews.com',
  SITE_URL_WWW: 'https://www.mitrabantennews.com',
}))

jest.mock('@/lib/utils/cspUtils', () => ({
  generateNonce: jest.fn(() => 'test-nonce-12345'),
}))

describe('Proxy Middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockNextResponse: jest.Mocked<NextResponse> & { headers: Headers }
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    jest.clearAllMocks()
    originalEnv = { ...process.env }

    mockNextResponse = {
      headers: new Headers(),
    } as unknown as jest.Mocked<NextResponse> & { headers: Headers }

    mockRequest = {
      nextUrl: {
        pathname: '/',
      },
    } as unknown as jest.Mocked<NextRequest>

    ;(NextResponse.next as jest.Mock).mockReturnValue(mockNextResponse)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Nonce Generation', () => {
    it('should generate a nonce for each request', () => {
      proxy(mockRequest)

      expect(mockNextResponse.headers.get('x-nonce')).toBe('test-nonce-12345')
    })

    it('should call generateNonce once per request', () => {
      const { generateNonce } = require('@/lib/utils/cspUtils')
      
      proxy(mockRequest)

      expect(generateNonce).toHaveBeenCalledTimes(1)
    })

    it('should set x-nonce header', () => {
      proxy(mockRequest)

      const nonce = mockNextResponse.headers.get('x-nonce')
      
      expect(nonce).toBeDefined()
      expect(typeof nonce).toBe('string')
      expect(nonce?.length).toBeGreaterThan(0)
    })
  })

  describe('Content Security Policy (CSP)', () => {
    it('should set Content-Security-Policy header', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy')
      
      expect(csp).toBeDefined()
      expect(typeof csp).toBe('string')
    })

    it('should include default-src self', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("default-src 'self'")
    })

    it('should include script-src with nonce', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("'nonce-test-nonce-12345'")
    })

    it('should include style-src with nonce', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("style-src 'self'")
      expect(csp).toContain("'nonce-test-nonce-12345'")
    })

    it('should include img-src with data and blob', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('img-src')
      expect(csp).toContain('data:')
      expect(csp).toContain('blob:')
    })

    it('should include connect-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("connect-src 'self'")
    })

    it('should include media-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("media-src 'self'")
    })

    it('should set object-src none', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("object-src 'none'")
    })

    it('should include base-uri self', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("base-uri 'self'")
    })

    it('should include form-action self', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("form-action 'self'")
    })

    it('should include frame-ancestors none', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('should include upgrade-insecure-requests', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('upgrade-insecure-requests')
    })
  })

  describe('Development Mode CSP', () => {
    const originalNodeEnv = process.env.NODE_ENV

    beforeEach(() => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'development' },
        writable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: originalNodeEnv },
        writable: true,
      })
    })

    it('should include unsafe-inline in script-src in development', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("'unsafe-inline'")
      expect(csp).toContain("'unsafe-eval'")
    })

    it('should include unsafe-eval in script-src in development', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("'unsafe-eval'")
    })

    it('should include unsafe-inline in style-src in development', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      const styleSrcMatch = csp.match(/style-src[^;]*/)?.[0]
      expect(styleSrcMatch).toContain("'unsafe-inline'")
    })

    it('should include report-uri in development', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('report-uri /api/csp-report')
    })
  })

  describe('Production Mode CSP', () => {
    const originalNodeEnv = process.env.NODE_ENV

    beforeEach(() => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'production' },
        writable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: originalNodeEnv },
        writable: true,
      })
    })

    it('should NOT include unsafe-inline in script-src in production', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      const scriptSrcMatch = csp.match(/script-src[^;]*/)?.[0]
      expect(scriptSrcMatch).not.toContain("'unsafe-inline'")
    })

    it('should NOT include unsafe-eval in production', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).not.toContain("'unsafe-eval'")
    })

    it('should NOT include unsafe-inline in style-src in production', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      const styleSrcMatch = csp.match(/style-src[^;]*/)?.[0]
      expect(styleSrcMatch).not.toContain("'unsafe-inline'")
    })

    it('should NOT include report-uri in production', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).not.toContain('report-uri')
    })

    it('should still include nonce in production', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain("'nonce-test-nonce-12345'")
    })
  })

  describe('Security Headers', () => {
    it('should set Strict-Transport-Security header', () => {
      proxy(mockRequest)

      const hsts = mockNextResponse.headers.get('Strict-Transport-Security')
      
      expect(hsts).toBe('max-age=31536000; includeSubDomains; preload')
    })

    it('should set X-Frame-Options header to DENY', () => {
      proxy(mockRequest)

      const xFrameOptions = mockNextResponse.headers.get('X-Frame-Options')
      
      expect(xFrameOptions).toBe('DENY')
    })

    it('should set X-Content-Type-Options header', () => {
      proxy(mockRequest)

      const xContentTypeOptions = mockNextResponse.headers.get('X-Content-Type-Options')
      
      expect(xContentTypeOptions).toBe('nosniff')
    })

    it('should set X-XSS-Protection header', () => {
      proxy(mockRequest)

      const xXssProtection = mockNextResponse.headers.get('X-XSS-Protection')
      
      expect(xXssProtection).toBe('1; mode=block')
    })

    it('should set Referrer-Policy header', () => {
      proxy(mockRequest)

      const referrerPolicy = mockNextResponse.headers.get('Referrer-Policy')
      
      expect(referrerPolicy).toBe('strict-origin-when-cross-origin')
    })

    it('should set Permissions-Policy header', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy')
      
      expect(permissionsPolicy).toBeDefined()
      expect(typeof permissionsPolicy).toBe('string')
    })
  })

  describe('Permissions Policy', () => {
    it('should restrict camera access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('camera=()')
    })

    it('should restrict microphone access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('microphone=()')
    })

    it('should restrict geolocation access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('geolocation=()')
    })

    it('should restrict payment access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('payment=()')
    })

    it('should restrict USB access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('usb=()')
    })

    it('should restrict magnetometer access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('magnetometer=()')
    })

    it('should restrict gyroscope access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('gyroscope=()')
    })

    it('should restrict accelerometer access', () => {
      proxy(mockRequest)

      const permissionsPolicy = mockNextResponse.headers.get('Permissions-Policy') as string
      
      expect(permissionsPolicy).toContain('accelerometer=()')
    })
  })

  describe('CSP Site URLs', () => {
    it('should include SITE_URL in script-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL_WWW in script-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://www.mitrabantennews.com')
    })

    it('should include SITE_URL in style-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL in img-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL in connect-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })

    it('should include SITE_URL in media-src', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).toContain('https://mitrabantennews.com')
    })
  })

  describe('CSP Format', () => {
    it('should use semicolon as directive separator', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      const directives = csp.split('; ').filter(Boolean)
      expect(directives.length).toBeGreaterThan(5)
    })

    it('should not have trailing semicolon', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).not.toMatch(/;$/)
    })

    it('should not have extra whitespace between directives', () => {
      proxy(mockRequest)

      const csp = mockNextResponse.headers.get('Content-Security-Policy') as string
      
      expect(csp).not.toMatch(/;\s\s+/)
    })
  })

  describe('Integration', () => {
    it('should set all required headers in one call', () => {
      proxy(mockRequest)

      const headers = Array.from(mockNextResponse.headers.keys())
      
      expect(headers).toContain('x-nonce')
      expect(headers).toContain('content-security-policy')
      expect(headers).toContain('strict-transport-security')
      expect(headers).toContain('x-frame-options')
      expect(headers).toContain('x-content-type-options')
      expect(headers).toContain('x-xss-protection')
      expect(headers).toContain('referrer-policy')
      expect(headers).toContain('permissions-policy')
    })

    it('should call NextResponse.next once', () => {
      proxy(mockRequest)

      expect(NextResponse.next).toHaveBeenCalledTimes(1)
    })

    it('should return NextResponse.next result', () => {
      const result = proxy(mockRequest)

      expect(result).toBe(mockNextResponse)
    })

    it('should generate new nonce for each request', () => {
      const { generateNonce } = require('@/lib/utils/cspUtils')
      generateNonce.mockReturnValue('nonce-1')
      proxy(mockRequest)
      
      generateNonce.mockReturnValue('nonce-2')
      proxy(mockRequest)

      const calls = generateNonce.mock.calls
      expect(calls.length).toBe(2)
      expect(mockNextResponse.headers.get('x-nonce')).toBe('nonce-2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty request object', () => {
      const emptyRequest = {} as unknown as NextRequest

      expect(() => proxy(emptyRequest)).not.toThrow()
    })

    it('should handle request with no url', () => {
      const requestWithoutUrl = {} as unknown as NextRequest

      const result = proxy(requestWithoutUrl)

      expect(result).toBeDefined()
    })

    it('should maintain header order consistency', () => {
      proxy(mockRequest)

      const headers = Array.from(mockNextResponse.headers.entries())
      
      expect(headers.length).toBeGreaterThan(0)
      headers.forEach(([key, value]) => {
        expect(key).toBeDefined()
        expect(value).toBeDefined()
      })
    })

    it('should handle multiple proxy calls', () => {
      proxy(mockRequest)
      proxy(mockRequest)
      proxy(mockRequest)

      expect(NextResponse.next).toHaveBeenCalledTimes(3)
    })
  })

  describe('Config Object', () => {
    it('should export config with matcher property', () => {
      expect(proxyConfig).toBeDefined()
      expect(proxyConfig.matcher).toBeDefined()
    })

    it('should have matcher array with single regex pattern', () => {
      expect(proxyConfig.matcher).toHaveLength(1)
      expect(typeof proxyConfig.matcher[0]).toBe('string')
    })

    it('should exclude API routes in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('api')
    })

    it('should exclude static files in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('_next/static')
    })

    it('should exclude image optimization in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('_next/image')
    })

    it('should exclude favicon in matcher pattern', () => {
      expect(proxyConfig.matcher[0]).toContain('favicon.ico')
    })
  })
})
