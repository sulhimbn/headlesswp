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

describe('Health Check API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    telemetryCollector.clear()
    resetAllRateLimitState()
  })

  afterEach(() => {
    telemetryCollector.clear()
  })

  describe('GET /api/health', () => {
    it('should return 200 when health check passes', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy',
        version: 'v2'
      })

      const response = await HealthGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.latency).toBe(100)
      expect(data.version).toBe('v2')
      expect(data.uptime).toBeGreaterThan(0)
    })

    it('should return 503 when health check fails', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: false,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 5000,
        message: 'API is unhealthy',
        error: 'ECONNREFUSED'
      })

      const response = await HealthGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.error).toBe('ECONNREFUSED')
      expect(data.latency).toBe(5000)
    })

    it('should return 500 when health check throws error', async () => {
      checkApiHealth.mockRejectedValue(new Error('Network error'))

      const response = await HealthGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.status).toBe('error')
      expect(data.error).toBe('Network error')
    })

    it('should record telemetry for healthy check', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy'
      })

      await HealthGET(mockRequest)

      const healthEvents = telemetryCollector.getEventsByCategory('health-check')

      expect(healthEvents).toHaveLength(1)
      expect(healthEvents[0].type).toBe('healthy')
      expect(healthEvents[0].data.healthy).toBe(true)
    })

    it('should record telemetry for unhealthy check', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: false,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 5000,
        message: 'API is unhealthy',
        error: 'ECONNREFUSED'
      })

      await HealthGET(mockRequest)

      const events = telemetryCollector.getEventsByCategory('health-check')

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('unhealthy')
      expect(events[0].data.healthy).toBe(false)
    })

    it('should set no-cache headers', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-10T10:00:00Z',
        latency: 100,
        message: 'API is healthy'
      })

      const response = await HealthGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })

  describe('GET /api/health/readiness', () => {
    it('should return 200 when system is ready', async () => {
      const response = await ReadinessGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('ready')
      expect(data.checks).toBeDefined()
      expect(data.checks.cache.status).toBe('ok')
      expect(data.checks.memory.status).toBe('ok')
      expect(data.uptime).toBeGreaterThan(0)
    })

    it('should record telemetry for readiness check', async () => {
      await ReadinessGET(mockRequest)

      const events = telemetryCollector.getEventsByCategory('health-check')

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('healthy')
      expect(events[0].data.endpoint).toBe('/api/health/readiness')
    })

    it('should set no-cache headers', async () => {
      const response = await ReadinessGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should return 503 when readiness check fails', async () => {
      let callCount = 0
      const originalRecord = telemetryCollector.record.bind(telemetryCollector)
      const spy = jest.spyOn(telemetryCollector, 'record').mockImplementation((event) => {
        callCount++
        if (callCount === 1) {
          throw new Error('Readiness check failed')
        }
        return originalRecord(event)
      })

      const response = await ReadinessGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('not-ready')
      expect(data.error).toBe('Readiness check failed')

      spy.mockRestore()
    })

    it('should record telemetry for unhealthy readiness check', async () => {
      let callCount = 0
      const originalRecord = telemetryCollector.record.bind(telemetryCollector)
      const spy = jest.spyOn(telemetryCollector, 'record').mockImplementation((event) => {
        callCount++
        if (callCount === 1) {
          throw new Error('System not ready')
        }
        return originalRecord(event)
      })

      await ReadinessGET(mockRequest)

      const events = telemetryCollector.getEventsByCategory('health-check')

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('unhealthy')
      expect(events[0].data.healthy).toBe(false)
      expect(events[0].data.error).toBe('System not ready')

      spy.mockRestore()
    })

    it('should set error response headers when readiness check fails', async () => {
      let callCount = 0
      const originalRecord = telemetryCollector.record.bind(telemetryCollector)
      const spy = jest.spyOn(telemetryCollector, 'record').mockImplementation((event) => {
        callCount++
        if (callCount === 1) {
          throw new Error('Readiness error')
        }
        return originalRecord(event)
      })

      const response = await ReadinessGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')

      spy.mockRestore()
    })
  })

  describe('GET /api/observability/metrics', () => {
    it('should return metrics summary', async () => {
      telemetryCollector.record({
        type: 'test',
        category: 'api-request',
        data: { test: true }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(data.summary.totalEvents).toBeGreaterThan(0)
      expect(data.summary.eventTypes).toBeGreaterThan(0)
      expect(data.summary.timestamp).toBeDefined()
      expect(data.summary.uptime).toBeGreaterThan(0)
    })

    it('should return empty stats when no events', async () => {
      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.totalEvents).toBe(0)
      expect(data.circuitBreaker.totalEvents).toBe(0)
      expect(data.retry.totalEvents).toBe(0)
      expect(data.rateLimit.totalEvents).toBe(0)
      expect(data.healthCheck.totalEvents).toBe(0)
      expect(data.apiRequest.totalEvents).toBe(0)
    })

    it('should return circuit breaker metrics', async () => {
      telemetryCollector.record({
        type: 'state-change',
        category: 'circuit-breaker',
        data: { state: 'OPEN' }
      })
      telemetryCollector.record({
        type: 'failure',
        category: 'circuit-breaker',
        data: { failureCount: 5 }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.circuitBreaker.stateChanges).toBe(1)
      expect(data.circuitBreaker.failures).toBe(1)
      expect(data.circuitBreaker.totalEvents).toBe(2)
      expect(data.circuitBreaker.recentEvents).toHaveLength(2)
    })

    it('should return retry metrics', async () => {
      telemetryCollector.record({
        type: 'retry',
        category: 'retry',
        data: { attempt: 1 }
      })
      telemetryCollector.record({
        type: 'retry-success',
        category: 'retry',
        data: { attempt: 2 }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.retry.retries).toBe(1)
      expect(data.retry.retrySuccesses).toBe(1)
      expect(data.retry.totalEvents).toBe(2)
    })

    it('should return rate limit metrics', async () => {
      telemetryCollector.record({
        type: 'exceeded',
        category: 'rate-limit',
        data: { limit: 60 }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.rateLimit.exceeded).toBe(1)
      expect(data.rateLimit.totalEvents).toBe(1)
    })

    it('should return health check metrics', async () => {
      telemetryCollector.record({
        type: 'healthy',
        category: 'health-check',
        data: { healthy: true }
      })
      telemetryCollector.record({
        type: 'unhealthy',
        category: 'health-check',
        data: { healthy: false }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.healthCheck.healthy).toBe(1)
      expect(data.healthCheck.unhealthy).toBe(1)
      expect(data.healthCheck.totalEvents).toBe(2)
    })

    it('should return API request metrics', async () => {
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: {
          method: 'GET',
          endpoint: '/wp/v2/posts',
          statusCode: 200,
          duration: 100,
          cacheHit: true
        }
      })
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: {
          method: 'GET',
          endpoint: '/wp/v2/posts',
          statusCode: 500,
          duration: 5000,
          cacheHit: false
        }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.apiRequest.totalRequests).toBe(2)
      expect(data.apiRequest.successful).toBe(1)
      expect(data.apiRequest.failed).toBe(1)
      expect(data.apiRequest.averageDuration).toBeGreaterThan(0)
      expect(data.apiRequest.cacheHits).toBe(1)
      expect(data.apiRequest.cacheMisses).toBe(1)
    })

    it('should calculate average duration correctly', async () => {
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: {
          method: 'GET',
          endpoint: '/wp/v2/posts',
          statusCode: 200,
          duration: 100
        }
      })
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: {
          method: 'GET',
          endpoint: '/wp/v2/posts',
          statusCode: 200,
          duration: 200
        }
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.apiRequest.averageDuration).toBe(150)
    })

    it('should limit recent events to 10', async () => {
      for (let i = 0; i < 15; i++) {
        telemetryCollector.record({
          type: 'request',
          category: 'api-request',
          data: { test: i }
        })
      }

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(data.apiRequest.totalRequests).toBe(15)
      expect(data.apiRequest.recentEvents).toHaveLength(10)
    })

    it('should set no-cache headers', async () => {
      const response = await MetricsGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should return 500 on error', async () => {
      jest.spyOn(telemetryCollector, 'getEvents').mockImplementation(() => {
        throw new Error('Test error')
      })

      const response = await MetricsGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Test error')
    })
  })
})
