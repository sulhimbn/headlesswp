import { GET as PerformanceGET } from '@/app/api/observability/performance/route'
import { performanceMetricsCollector, captureCurrentResourceUtilization } from '@/lib/api/performanceMetrics'
import { resetAllRateLimitState, checkRateLimit } from '@/lib/api/rateLimitMiddleware'

jest.mock('@/lib/api/performanceMetrics', () => ({
  performanceMetricsCollector: {
    getApiResponseMetrics: jest.fn(),
    getResourceMetrics: jest.fn(),
    getErrorMetrics: jest.fn(),
    getWebVitalsMetrics: jest.fn(),
  },
  captureCurrentResourceUtilization: jest.fn(),
}))

jest.mock('@/lib/api/rateLimitMiddleware', () => ({
  ...jest.requireActual('@/lib/api/rateLimitMiddleware'),
  withApiRateLimit: jest.fn((handler) => handler),
  checkRateLimit: jest.fn(),
  resetAllRateLimitState: jest.fn(),
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

const mockPerformanceMetricsCollector = require('@/lib/api/performanceMetrics')

describe('Performance API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
    mockPerformanceMetricsCollector.performanceMetricsCollector.getApiResponseMetrics.mockReturnValue({
      total: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      avg: 0,
      min: 0,
      max: 0,
      byEndpoint: {}
    })
    mockPerformanceMetricsCollector.performanceMetricsCollector.getResourceMetrics.mockReturnValue({
      latest: null,
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      avgHeapUsage: 0
    })
    mockPerformanceMetricsCollector.performanceMetricsCollector.getErrorMetrics.mockReturnValue([])
    mockPerformanceMetricsCollector.performanceMetricsCollector.getWebVitalsMetrics.mockReturnValue({
      events: [],
      byMetricName: {}
    })
    mockPerformanceMetricsCollector.captureCurrentResourceUtilization.mockReturnValue({
      cpuUsagePercent: 10,
      memoryUsageMB: 256,
      memoryUsagePercent: 20,
      heapUsedMB: 128,
      heapTotalMB: 512,
      heapPercent: 25
    })
  })

  describe('GET /api/observability/performance', () => {
    const mockRequest = {} as any

    it('should return 200 with performance metrics', async () => {
      mockPerformanceMetricsCollector.performanceMetricsCollector.getApiResponseMetrics.mockReturnValue({
        total: 100,
        p50: 50,
        p95: 150,
        p99: 200,
        avg: 75,
        min: 10,
        max: 300,
        byEndpoint: {
          'GET:/api/posts': { count: 50, p50: 40, p95: 100, p99: 150, avg: 60 }
        }
      })
      mockPerformanceMetricsCollector.performanceMetricsCollector.getErrorMetrics.mockReturnValue([
        { endpoint: '/api/posts', method: 'GET', errorType: 'NETWORK_ERROR', count: 2, totalRequests: 100, rate: 0.02 }
      ])
      mockPerformanceMetricsCollector.performanceMetricsCollector.getWebVitalsMetrics.mockReturnValue({
        events: [
          { name: 'FCP', value: 1200, rating: 'good', id: 'test-1' }
        ],
        byMetricName: {
          FCP: { count: 1, avg: 1200, min: 1200, max: 1200 }
        }
      })

      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(data.summary.totalApiCalls).toBe(100)
      expect(data.summary.totalErrorTypes).toBe(1)
      expect(data.apiResponse.total).toBe(100)
      expect(data.apiResponse.p50).toBe(50)
      expect(data.errorRates).toHaveLength(1)
      expect(data.webVitals.events).toHaveLength(1)
    })

    it('should include uptime in response', async () => {
      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.uptime).toBeGreaterThan(0)
    })

    it('should include current resource utilization', async () => {
      mockPerformanceMetricsCollector.captureCurrentResourceUtilization.mockReturnValue({
        cpuUsagePercent: 45,
        memoryUsageMB: 512,
        memoryUsagePercent: 40,
        heapUsedMB: 256,
        heapTotalMB: 1024,
        heapPercent: 25
      })
      mockPerformanceMetricsCollector.performanceMetricsCollector.getResourceMetrics.mockReturnValue({
        latest: {
          cpuUsagePercent: 40,
          memoryUsageMB: 480,
          memoryUsagePercent: 38,
          heapUsedMB: 240,
          heapTotalMB: 1024,
          heapPercent: 23
        },
        avgCpuUsage: 42,
        avgMemoryUsage: 39,
        avgHeapUsage: 24
      })

      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.resourceUtilization.current.cpuUsagePercent).toBe(45)
      expect(data.resourceUtilization.avgCpuUsage).toBe(42)
    })

    it('should include byEndpoint metrics when available', async () => {
      mockPerformanceMetricsCollector.performanceMetricsCollector.getApiResponseMetrics.mockReturnValue({
        total: 50,
        p50: 30,
        p95: 80,
        p99: 100,
        avg: 40,
        min: 5,
        max: 150,
        byEndpoint: {
          'GET:/api/posts': { count: 30, p50: 25, p95: 60, p99: 80, avg: 35 },
          'GET:/api/pages': { count: 20, p50: 40, p95: 100, p99: 120, avg: 50 }
        }
      })

      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.apiResponse.byEndpoint['GET:/api/posts']).toBeDefined()
      expect(data.apiResponse.byEndpoint['GET:/api/pages']).toBeDefined()
    })

    it('should return empty metrics when no data collected', async () => {
      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.totalApiCalls).toBe(0)
      expect(data.apiResponse.total).toBe(0)
      expect(data.errorRates).toHaveLength(0)
      expect(data.webVitals.events).toHaveLength(0)
    })

    it('should limit web vitals events to 100', async () => {
      const manyEvents = Array(150).fill(null).map((_, i) => ({
        name: 'FCP',
        value: 1000 + i,
        rating: 'good' as const,
        id: `test-${i}`
      }))
      mockPerformanceMetricsCollector.performanceMetricsCollector.getWebVitalsMetrics.mockReturnValue({
        events: manyEvents,
        byMetricName: { FCP: { count: 150, avg: 1074, min: 1000, max: 1149 } }
      })

      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.webVitals.events).toHaveLength(100)
    })

    it('should set no-cache headers', async () => {
      const response = await PerformanceGET(mockRequest)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should handle errors gracefully and return 500', async () => {
      mockPerformanceMetricsCollector.performanceMetricsCollector.getApiResponseMetrics.mockImplementation(() => {
        throw new Error('Metrics error')
      })

      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Metrics error')
    })

    it('should round metrics values', async () => {
      mockPerformanceMetricsCollector.performanceMetricsCollector.getApiResponseMetrics.mockReturnValue({
        total: 100,
        p50: 55.6,
        p95: 145.9,
        p99: 198.3,
        avg: 73.4,
        min: 12.1,
        max: 287.8,
        byEndpoint: {}
      })
      mockPerformanceMetricsCollector.performanceMetricsCollector.getResourceMetrics.mockReturnValue({
        latest: null,
        avgCpuUsage: 45.7,
        avgMemoryUsage: 32.3,
        avgHeapUsage: 28.9
      })

      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.apiResponse.p50).toBe(56)
      expect(data.apiResponse.p95).toBe(146)
      expect(data.apiResponse.avg).toBe(73)
      expect(data.resourceUtilization.avgCpuUsage).toBe(46)
    })

    it('should include timestamp in response', async () => {
      const response = await PerformanceGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.timestamp).toBeDefined()
      expect(new Date(data.summary.timestamp).getTime()).toBeGreaterThan(0)
    })
  })
})
