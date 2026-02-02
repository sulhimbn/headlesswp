import { POST as CspReportPOST } from '@/app/api/csp-report/route'
import { logger } from '@/lib/utils/logger'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/utils/logger')
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => {
      const headersMap: Record<string, string> = { ...(init?.headers || {}) }
      return {
        status: init?.status || 200,
        json: () => Promise.resolve(body),
        headers: {
          get: (key: string) => headersMap[key] || null,
          set: (key: string, value: string) => {
            headersMap[key] = value
          }
        }
      }
    })
  }
}))

const { logger: mockLogger } = require('@/lib/utils/logger')

describe('CSP Report API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
  })

  describe('POST /api/csp-report', () => {
    it('should return 200 when CSP report is processed successfully', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/',
          'referrer': '',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "default-src 'self'; script-src 'self' 'nonce-abc123'",
          'disposition': 'report',
          'blocked-uri': 'https://evil.com/script.js',
          'line-number': 15,
          'column-number': 10,
          'source-file': 'https://example.com/app.js',
          'status-code': 200,
          'script-sample': ''
        }
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'CSP Violation:',
        JSON.stringify(mockReport, null, 2)
      )
    })

    it('should return 400 when request body is invalid', async () => {
      const mockRequest = {
        json: async () => {
          throw new Error('Invalid JSON')
        }
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Failed to process report')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing CSP report:',
        expect.any(Error)
      )
    })

    it('should log CSP violation with minimal report data', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'CSP Violation:',
        JSON.stringify(mockReport, null, 2)
      )
    })

    it('should handle empty CSP report', async () => {
      const mockReport = {}

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'CSP Violation:',
        JSON.stringify(mockReport, null, 2)
      )
    })

    it('should handle CSP report with additional metadata', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'referrer': 'https://example.com/home',
          'violated-directive': 'img-src',
          'effective-directive': 'img-src',
          'original-policy': "default-src 'self'; img-src 'self' data: https:",
          'disposition': 'report',
          'blocked-uri': 'https://untrusted.com/image.jpg',
          'line-number': 42,
          'column-number': 5,
          'source-file': 'https://example.com/components/Image.jsx',
          'status-code': 200,
          'script-sample': ''
        },
        'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'timestamp': '2026-02-02T12:00:00Z'
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'CSP Violation:',
        JSON.stringify(mockReport, null, 2)
      )
    })

    it('should handle script-src-elem violation', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/',
          'violated-directive': 'script-src-elem',
          'effective-directive': 'script-src-elem',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'inline',
          'line-number': 10,
          'column-number': 20,
          'source-file': 'https://example.com/index.html',
          'status-code': 200,
          'script-sample': '<script>alert("xss")</script>'
        }
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle style-src violation', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/',
          'violated-directive': 'style-src',
          'effective-directive': 'style-src',
          'original-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'",
          'disposition': 'report',
          'blocked-uri': 'inline',
          'line-number': 5,
          'column-number': 15,
          'source-file': 'https://example.com/styles.css',
          'status-code': 200
        }
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle connect-src violation', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/',
          'violated-directive': 'connect-src',
          'effective-directive': 'connect-src',
          'original-policy': "default-src 'self'; connect-src 'self'",
          'disposition': 'report',
          'blocked-uri': 'wss://untrusted.com/socket',
          'line-number': 30,
          'column-number': 10,
          'source-file': 'https://example.com/socket.js',
          'status-code': 200
        }
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle img-src violation with data URI', async () => {
      const mockReport = {
        'csp-report': {
          'document-uri': 'https://example.com/',
          'violated-directive': 'img-src',
          'effective-directive': 'img-src',
          'original-policy': "default-src 'self'; img-src 'self'",
          'disposition': 'report',
          'blocked-uri': 'data:image/svg+xml;base64,PHN2Zy4uLz4=',
          'line-number': 18,
          'column-number': 5,
          'source-file': 'https://example.com/Image.jsx',
          'status-code': 200
        }
      }

      const mockRequest = {
        json: async () => mockReport
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle malformed JSON in request body', async () => {
      const mockRequest = {
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON')
        }
      } as any

      const response = await CspReportPOST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Failed to process report')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing CSP report:',
        expect.any(SyntaxError)
      )
    })
  })
})
