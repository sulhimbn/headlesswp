import { NextRequest, NextResponse } from 'next/server'
import { apiSecurity } from '@/lib/api-security'

// Mock the api-security module
jest.mock('@/lib/api-security', () => ({
  apiSecurity: {
    validateRequest: jest.fn(),
    getCORSHeaders: jest.fn()
  }
}))

// Import the middleware function directly
const { middleware } = require('@/middleware')

describe('Middleware', () => {
  let mockRequest: NextRequest
  let mockResponse: NextResponse

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {
      method: 'GET',
      headers: new Map([
        ['origin', 'http://localhost:3000'],
        ['user-agent', 'test-agent']
      ]),
      url: 'http://localhost:3000/test'
    } as unknown as NextRequest

    mockResponse = {
      headers: {
        set: jest.fn()
      }
    } as unknown as NextResponse

    // Mock NextResponse.next and NextResponse.json
    jest.spyOn(NextResponse, 'next').mockReturnValue(mockResponse)
    jest.spyOn(NextResponse, 'json').mockReturnValue({
      status: jest.fn().mockReturnThis(),
      headers: new Map()
    } as any)
  })

  describe('CORS Preflight', () => {
    it('should handle OPTIONS requests with CORS headers', () => {
      const mockCorsHeaders = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400'
      }

      ;(apiSecurity.getCORSHeaders as jest.Mock).mockReturnValue(mockCorsHeaders)

      const optionsRequest = {
        ...mockRequest,
        method: 'OPTIONS'
      }

      middleware(optionsRequest)

      expect(apiSecurity.getCORSHeaders).toHaveBeenCalledWith('http://localhost:3000')
    })
  })

  describe('Request Validation', () => {
    it('should allow valid requests', () => {
      const validationResponse = {
        allowed: true,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': '1234567890'
        }
      }

      ;(apiSecurity.validateRequest as jest.Mock).mockReturnValue(validationResponse)
      ;(apiSecurity.getCORSHeaders as jest.Mock).mockReturnValue({})

      middleware(mockRequest)

      expect(apiSecurity.validateRequest).toHaveBeenCalledWith(mockRequest)
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('should block invalid requests', () => {
      const validationResponse = {
        allowed: false,
        status: 429,
        message: 'Too many requests',
        headers: {
          'Retry-After': '60'
        }
      }

      ;(apiSecurity.validateRequest as jest.Mock).mockReturnValue(validationResponse)

      middleware(mockRequest)

      expect(apiSecurity.validateRequest).toHaveBeenCalledWith(mockRequest)
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    })

    it('should add rate limit headers to successful responses', () => {
      const validationResponse = {
        allowed: true,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99'
        }
      }

      ;(apiSecurity.validateRequest as jest.Mock).mockReturnValue(validationResponse)
      ;(apiSecurity.getCORSHeaders as jest.Mock).mockReturnValue({})

      middleware(mockRequest)

      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '99')
    })

    it('should add CORS headers for allowed origins', () => {
      const validationResponse = { allowed: true }
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'http://localhost:3000'
      }

      ;(apiSecurity.validateRequest as jest.Mock).mockReturnValue(validationResponse)
      ;(apiSecurity.getCORSHeaders as jest.Mock).mockReturnValue(corsHeaders)

      middleware(mockRequest)

      expect(mockResponse.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000')
    })
  })

  describe('Security Headers', () => {
    it('should set all required security headers', () => {
      const validationResponse = { allowed: true }

      ;(apiSecurity.validateRequest as jest.Mock).mockReturnValue(validationResponse)
      ;(apiSecurity.getCORSHeaders as jest.Mock).mockReturnValue({})

      middleware(mockRequest)

      // Verify that security headers are set
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block')
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      )
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(),microphone=(),geolocation=(),payment=(),usb=(),magnetometer=(),gyroscope=(),accelerometer=()'
      )
    })

    it('should set CSP header with nonce', () => {
      const validationResponse = { allowed: true }

      ;(apiSecurity.validateRequest as jest.Mock).mockReturnValue(validationResponse)
      ;(apiSecurity.getCORSHeaders as jest.Mock).mockReturnValue({})

      middleware(mockRequest)

      // Verify CSP header is set
      const cspCall = mockResponse.headers.set.mock.calls.find(
        call => call[0] === 'Content-Security-Policy'
      )
      expect(cspCall).toBeDefined()
      expect(cspCall[1]).toContain("default-src 'self'")
      expect(cspCall[1]).toContain('nonce-')
    })
  })
})