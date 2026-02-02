import { 
  PerformanceMetricsCollector, 
  performanceMetricsCollector,
  captureCurrentResourceUtilization,
  calculatePercentiles
} from '@/lib/api/performanceMetrics'
import { telemetryCollector } from '@/lib/api/telemetry'

describe('PerformanceMetricsCollector', () => {
  let collector: PerformanceMetricsCollector

  beforeEach(() => {
    collector = new PerformanceMetricsCollector()
    telemetryCollector.clear()
  })

  afterEach(() => {
    collector.clear()
    telemetryCollector.clear()
  })

  describe('recordWebVital', () => {
    it('should record web vital metric', () => {
      const metric = {
        name: 'FCP' as const,
        value: 1200,
        rating: 'good' as const,
        id: 'test-id-1'
      }

      collector.recordWebVital(metric)

      const webVitalsMetrics = collector.getWebVitalsMetrics()
      expect(webVitalsMetrics.events).toHaveLength(1)
      expect(webVitalsMetrics.events[0]).toMatchObject({
        name: 'FCP',
        value: 1200,
        rating: 'good',
        id: 'test-id-1'
      })
    })

    it('should record multiple web vital metrics', () => {
      const metrics = [
        { name: 'FCP' as const, value: 1200, rating: 'good' as const, id: 'test-id-2' },
        { name: 'LCP' as const, value: 2400, rating: 'needs-improvement' as const, id: 'test-id-3' },
        { name: 'CLS' as const, value: 0.1, rating: 'good' as const, id: 'test-id-4' }
      ]

      metrics.forEach(metric => collector.recordWebVital(metric))

      const webVitalsMetrics = collector.getWebVitalsMetrics()
      expect(webVitalsMetrics.events).toHaveLength(3)
    })

    it('should aggregate web vitals by metric name', () => {
      const metrics = [
        { name: 'FCP' as const, value: 1000, rating: 'good' as const, id: 'test-id-5' },
        { name: 'FCP' as const, value: 1500, rating: 'needs-improvement' as const, id: 'test-id-6' },
        { name: 'FCP' as const, value: 2000, rating: 'poor' as const, id: 'test-id-7' }
      ]

      metrics.forEach(metric => collector.recordWebVital(metric))

      const webVitalsMetrics = collector.getWebVitalsMetrics()
      expect(webVitalsMetrics.byMetricName['FCP']).toEqual({
        count: 3,
        avg: 1500,
        min: 1000,
        max: 2000
      })
    })
  })

  describe('recordApiResponse', () => {
    it('should record API response time metric', () => {
      const metric = {
        endpoint: '/api/test',
        method: 'GET',
        duration: 100,
        statusCode: 200,
        cacheHit: false
      }

      collector.recordApiResponse(metric)

      const apiMetrics = collector.getApiResponseMetrics()
      expect(apiMetrics.total).toBe(1)
      expect(apiMetrics.p50).toBe(100)
      expect(apiMetrics.avg).toBe(100)
      expect(apiMetrics.min).toBe(100)
      expect(apiMetrics.max).toBe(100)
    })

    it('should record multiple API response times', () => {
      const metrics = [
        { endpoint: '/api/test', method: 'GET', duration: 50, statusCode: 200, cacheHit: false },
        { endpoint: '/api/test', method: 'GET', duration: 100, statusCode: 200, cacheHit: false },
        { endpoint: '/api/test', method: 'GET', duration: 150, statusCode: 200, cacheHit: false },
        { endpoint: '/api/test', method: 'GET', duration: 200, statusCode: 200, cacheHit: false },
        { endpoint: '/api/test', method: 'GET', duration: 250, statusCode: 200, cacheHit: false }
      ]

      metrics.forEach(metric => collector.recordApiResponse(metric))

      const apiMetrics = collector.getApiResponseMetrics()
      expect(apiMetrics.total).toBe(5)
      expect(apiMetrics.p50).toBe(150)
      expect(apiMetrics.p95).toBe(250)
      expect(apiMetrics.p99).toBe(250)
      expect(apiMetrics.avg).toBe(150)
      expect(apiMetrics.min).toBe(50)
      expect(apiMetrics.max).toBe(250)
    })

    it('should aggregate API metrics by endpoint', () => {
      const metrics = [
        { endpoint: '/api/posts', method: 'GET', duration: 100, statusCode: 200, cacheHit: false },
        { endpoint: '/api/posts', method: 'GET', duration: 150, statusCode: 200, cacheHit: false },
        { endpoint: '/api/users', method: 'GET', duration: 50, statusCode: 200, cacheHit: false },
        { endpoint: '/api/users', method: 'GET', duration: 75, statusCode: 200, cacheHit: false }
      ]

      metrics.forEach(metric => collector.recordApiResponse(metric))

      const apiMetrics = collector.getApiResponseMetrics()
      expect(apiMetrics.byEndpoint['GET:/api/posts']).toEqual({
        count: 2,
        p50: 150,
        p95: 150,
        p99: 150,
        avg: 125
      })
      expect(apiMetrics.byEndpoint['GET:/api/users']).toEqual({
        count: 2,
        p50: 75,
        p95: 75,
        p99: 75,
        avg: 62.5
      })
    })

    it('should respect max metrics limit', () => {
      const maxApiMetrics = 1000
      for (let i = 0; i < maxApiMetrics + 10; i++) {
        collector.recordApiResponse({
          endpoint: '/api/test',
          method: 'GET',
          duration: 100,
          statusCode: 200,
          cacheHit: false
        })
      }

      const apiMetrics = collector.getApiResponseMetrics()
      expect(apiMetrics.total).toBeLessThanOrEqual(maxApiMetrics)
    })
  })

  describe('recordResourceUtilization', () => {
    it('should record resource utilization metric', () => {
      const metric = {
        cpuUsagePercent: 50,
        memoryUsageMB: 512,
        memoryUsagePercent: 25,
        heapUsedMB: 256,
        heapTotalMB: 1024,
        heapPercent: 25
      }

      collector.recordResourceUtilization(metric)

      const resourceMetrics = collector.getResourceMetrics()
      expect(resourceMetrics.latest).toEqual(metric)
    })

    it('should record multiple resource metrics', () => {
      const metrics = [
        { cpuUsagePercent: 50, memoryUsageMB: 512, memoryUsagePercent: 25, heapUsedMB: 256, heapTotalMB: 1024, heapPercent: 25 },
        { cpuUsagePercent: 60, memoryUsageMB: 640, memoryUsagePercent: 31, heapUsedMB: 320, heapTotalMB: 1024, heapPercent: 31 },
        { cpuUsagePercent: 70, memoryUsageMB: 768, memoryUsagePercent: 38, heapUsedMB: 384, heapTotalMB: 1024, heapPercent: 38 }
      ]

      metrics.forEach(metric => collector.recordResourceUtilization(metric))

      const resourceMetrics = collector.getResourceMetrics()
      expect(resourceMetrics.avgCpuUsage).toBe(60)
      expect(resourceMetrics.avgMemoryUsage).toBeCloseTo(31.333)
      expect(resourceMetrics.avgHeapUsage).toBeCloseTo(31.333)
    })

    it('should respect max metrics limit', () => {
      const maxResourceMetrics = 100
      for (let i = 0; i < maxResourceMetrics + 10; i++) {
        collector.recordResourceUtilization({
          cpuUsagePercent: 50,
          memoryUsageMB: 512,
          memoryUsagePercent: 25,
          heapUsedMB: 256,
          heapTotalMB: 1024,
          heapPercent: 25
        })
      }

      const resourceMetrics = collector.getResourceMetrics()
      expect(collector['resourceMetrics'].length).toBeLessThanOrEqual(maxResourceMetrics)
    })
  })

  describe('recordError', () => {
    it('should record error metric', () => {
      collector.recordError('/api/test', 'GET', 'NETWORK_ERROR')

      const errorMetrics = collector.getErrorMetrics()
      expect(errorMetrics).toHaveLength(1)
      expect(errorMetrics[0]).toMatchObject({
        endpoint: '/api/test',
        method: 'GET',
        errorType: 'NETWORK_ERROR',
        count: 1,
        totalRequests: 1,
        rate: 1
      })
    })

    it('should increment error count for same endpoint', () => {
      collector.recordError('/api/test', 'GET', 'NETWORK_ERROR')
      collector.recordError('/api/test', 'GET', 'NETWORK_ERROR')

      const errorMetrics = collector.getErrorMetrics()
      expect(errorMetrics).toHaveLength(1)
      expect(errorMetrics[0].count).toBe(2)
      expect(errorMetrics[0].totalRequests).toBe(2)
      expect(errorMetrics[0].rate).toBe(1)
    })

    it('should calculate error rate when successes recorded', () => {
      collector.recordError('/api/test', 'GET', 'NETWORK_ERROR')
      collector.recordSuccess('/api/test', 'GET')
      collector.recordSuccess('/api/test', 'GET')

      const errorMetrics = collector.getErrorMetrics()
      expect(errorMetrics[0].count).toBe(1)
      expect(errorMetrics[0].totalRequests).toBe(3)
      expect(errorMetrics[0].rate).toBeCloseTo(0.333)
    })
  })

  describe('recordSuccess', () => {
    it('should record success for endpoint', () => {
      collector.recordError('/api/test', 'GET', 'NETWORK_ERROR')
      collector.recordSuccess('/api/test', 'GET')

      const errorMetrics = collector.getErrorMetrics()
      expect(errorMetrics[0].totalRequests).toBe(2)
    })

    it('should not create new error metrics for success', () => {
      collector.recordSuccess('/api/test', 'GET')

      const errorMetrics = collector.getErrorMetrics()
      expect(errorMetrics).toHaveLength(0)
    })
  })

  describe('clear', () => {
    it('should clear all metrics', () => {
      collector.recordWebVital({
        name: 'FCP',
        value: 1200,
        rating: 'good',
        id: 'test-id-8'
      })
      collector.recordApiResponse({
        endpoint: '/api/test',
        method: 'GET',
        duration: 100,
        statusCode: 200,
        cacheHit: false
      })
      collector.recordError('/api/test', 'GET', 'NETWORK_ERROR')

      collector.clear()

      const apiMetrics = collector.getApiResponseMetrics()
      const resourceMetrics = collector.getResourceMetrics()
      const errorMetrics = collector.getErrorMetrics()

      expect(apiMetrics.total).toBe(0)
      expect(resourceMetrics.latest).toBeNull()
      expect(errorMetrics).toHaveLength(0)
    })
  })

  describe('getApiResponseMetrics with no data', () => {
    it('should return empty metrics', () => {
      const apiMetrics = collector.getApiResponseMetrics()

      expect(apiMetrics).toEqual({
        total: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        min: 0,
        max: 0,
        byEndpoint: {}
      })
    })
  })

  describe('getResourceMetrics with no data', () => {
    it('should return empty metrics', () => {
      const resourceMetrics = collector.getResourceMetrics()

      expect(resourceMetrics).toEqual({
        latest: null,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgHeapUsage: 0
      })
    })
  })
})

describe('calculatePercentiles', () => {
  it('should calculate all percentiles', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const percentiles = calculatePercentiles(values, true, true, true)

    expect(percentiles.p50).toBe(60)
    expect(percentiles.p95).toBe(100)
    expect(percentiles.p99).toBe(100)
  })

  it('should calculate only requested percentiles', () => {
    const values = [10, 20, 30, 40, 50]
    const percentiles = calculatePercentiles(values, true, false, false)

    expect(percentiles.p50).toBe(30)
    expect(percentiles.p95).toBeUndefined()
    expect(percentiles.p99).toBeUndefined()
  })

  it('should handle empty array', () => {
    const percentiles = calculatePercentiles([])

    expect(percentiles).toEqual({})
  })

  it('should handle single value', () => {
    const values = [42]
    const percentiles = calculatePercentiles(values)

    expect(percentiles.p50).toBe(42)
    expect(percentiles.p95).toBe(42)
    expect(percentiles.p99).toBe(42)
  })
})

describe('captureCurrentResourceUtilization', () => {
  it('should return resource utilization metrics', () => {
    const metrics = captureCurrentResourceUtilization()

    expect(metrics).toHaveProperty('cpuUsagePercent')
    expect(metrics).toHaveProperty('memoryUsageMB')
    expect(metrics).toHaveProperty('memoryUsagePercent')
    expect(metrics).toHaveProperty('heapUsedMB')
    expect(metrics).toHaveProperty('heapTotalMB')
    expect(metrics).toHaveProperty('heapPercent')

    expect(typeof metrics.memoryUsageMB).toBe('number')
    expect(typeof metrics.heapUsedMB).toBe('number')
    expect(typeof metrics.heapTotalMB).toBe('number')
  })
})

describe('performanceMetricsCollector', () => {
  beforeEach(() => {
    performanceMetricsCollector.clear()
    telemetryCollector.clear()
  })

  afterEach(() => {
    performanceMetricsCollector.clear()
    telemetryCollector.clear()
  })

  it('should be a singleton instance', () => {
    expect(performanceMetricsCollector).toBeInstanceOf(PerformanceMetricsCollector)
  })

  it('should collect metrics across different calls', () => {
    performanceMetricsCollector.recordWebVital({
      name: 'FCP',
      value: 1200,
      rating: 'good',
      id: 'test-id-9'
    })

    performanceMetricsCollector.recordApiResponse({
      endpoint: '/api/test',
      method: 'GET',
      duration: 100,
      statusCode: 200,
      cacheHit: false
    })

    const webVitals = performanceMetricsCollector.getWebVitalsMetrics()
    const apiMetrics = performanceMetricsCollector.getApiResponseMetrics()

    expect(webVitals.events).toHaveLength(1)
    expect(apiMetrics.total).toBe(1)
  })
})
