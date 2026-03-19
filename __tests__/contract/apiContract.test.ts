import { GET as HealthGET } from '@/app/api/health/route'
import { GET as ReadinessGET } from '@/app/api/health/readiness/route'
import { GET as MetricsGET } from '@/app/api/observability/metrics/route'
import { telemetryCollector } from '@/lib/api/telemetry'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

const mockRequest = {} as any

jest.mock('@/lib/api/client', () => ({
  checkApiHealth: jest.fn()
}))

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

const { checkApiHealth } = require('@/lib/api/client')

describe('API Contract Tests - OpenAPI Specification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    telemetryCollector.clear()
    resetAllRateLimitState()
  })

  afterEach(() => {
    telemetryCollector.clear()
  })

  describe('GET /api/health', () => {
    it('should return 200 with valid health response schema', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy',
        version: 'v2'
      })

      const response = await HealthGET(mockRequest)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toSatisfySchemaInApiSpec('HealthResponse')
    })

    it('should return 503 when API is unhealthy', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: false,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 5000,
        error: 'Connection timeout'
      })

      const response = await HealthGET(mockRequest)
      const body = await response.json()

      expect(response.status).toBe(503)
      expect(body).toSatisfySchemaInApiSpec('UnhealthyResponse')
    })

    it('should include required fields in healthy response', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy',
        version: 'v2'
      })

      const response = await HealthGET(mockRequest)
      const body = await response.json()

      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('timestamp')
      expect(body).toHaveProperty('latency')
      expect(body).toHaveProperty('version')
      expect(body).toHaveProperty('uptime')
      expect(body.status).toBe('healthy')
    })

    it('should have no-cache headers', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy'
      })

      const response = await HealthGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    })
  })

  describe('GET /api/health/readiness', () => {
    it('should return 200 with valid readiness response schema', async () => {
      const response = await ReadinessGET(mockRequest)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toSatisfySchemaInApiSpec('ReadinessResponse')
    })

    it('should include required fields in ready response', async () => {
      const response = await ReadinessGET(mockRequest)
      const body = await response.json()

      expect(body).toHaveProperty('status', 'ready')
      expect(body).toHaveProperty('timestamp')
      expect(body).toHaveProperty('uptime')
      expect(body).toHaveProperty('checks')
      expect(body.checks).toHaveProperty('cache')
      expect(body.checks).toHaveProperty('memory')
    })

    it('should have no-cache headers', async () => {
      const response = await ReadinessGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    })
  })

  describe('GET /api/observability/metrics', () => {
    it('should return 200 with valid metrics response schema', async () => {
      telemetryCollector.record({
        type: 'test',
        category: 'api-request',
        data: { test: true }
      })

      const response = await MetricsGET(mockRequest)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toSatisfySchemaInApiSpec('MetricsResponse')
    })

    it('should include all required metric categories', async () => {
      const response = await MetricsGET(mockRequest)
      const body = await response.json()

      expect(body).toHaveProperty('summary')
      expect(body).toHaveProperty('circuitBreaker')
      expect(body).toHaveProperty('retry')
      expect(body).toHaveProperty('rateLimit')
      expect(body).toHaveProperty('healthCheck')
      expect(body).toHaveProperty('apiRequest')
    })

    it('should have no-cache headers', async () => {
      const response = await MetricsGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    })
  })
})

describe('API Contract Tests - Response Schema Validation', () => {
  describe('Health Response Schema', () => {
    it('should validate HealthResponse schema structure', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy',
        version: 'v2'
      })

      const response = await HealthGET(mockRequest)
      const body = await response.json()

      expect(body).toSatisfySchemaInApiSpec('HealthResponse')
      expect(typeof body.status).toBe('string')
      expect(typeof body.timestamp).toBe('string')
      expect(typeof body.latency).toBe('number')
      expect(typeof body.version).toBe('string')
      expect(typeof body.uptime).toBe('number')
    })
  })

  describe('Readiness Response Schema', () => {
    it('should validate ReadinessResponse schema structure', async () => {
      const response = await ReadinessGET(mockRequest)
      const body = await response.json()

      expect(body).toSatisfySchemaInApiSpec('ReadinessResponse')
      expect(body.status).toBe('ready')
      expect(body.checks).toHaveProperty('cache')
      expect(body.checks).toHaveProperty('memory')
    })
  })

  describe('Metrics Response Schema', () => {
    it('should validate MetricsResponse schema structure', async () => {
      telemetryCollector.record({
        type: 'test',
        category: 'api-request',
        data: { duration: 100 }
      })

      const response = await MetricsGET(mockRequest)
      const body = await response.json()

      expect(body).toSatisfySchemaInApiSpec('MetricsResponse')
      expect(body.summary).toHaveProperty('totalEvents')
      expect(body.circuitBreaker).toHaveProperty('stateChanges')
      expect(body.retry).toHaveProperty('retries')
      expect(body.rateLimit).toHaveProperty('exceeded')
      expect(body.healthCheck).toHaveProperty('healthy')
      expect(body.apiRequest).toHaveProperty('totalRequests')
    })
  })
})
