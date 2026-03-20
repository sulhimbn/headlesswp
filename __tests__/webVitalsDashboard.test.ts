import { PerformanceMetricsCollector, performanceMetricsCollector } from '@/lib/api/performanceMetrics'
import { telemetryCollector } from '@/lib/api/telemetry'

describe('WebVitalsDashboard', () => {
  let collector: PerformanceMetricsCollector

  beforeEach(() => {
    collector = new PerformanceMetricsCollector()
    telemetryCollector.clear()
  })

  afterEach(() => {
    collector.clear()
    telemetryCollector.clear()
  })

  describe('getWebVitalsMetrics', () => {
    it('should return empty metrics when no web vitals recorded', () => {
      const metrics = collector.getWebVitalsMetrics()
      
      expect(metrics.events).toHaveLength(0)
      expect(metrics.byMetricName).toEqual({})
    })

    it('should record and retrieve web vital metrics', () => {
      collector.recordWebVital({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        id: '1234567890-test-id'
      })

      const metrics = collector.getWebVitalsMetrics()
      
      expect(metrics.events).toHaveLength(1)
      expect(metrics.events[0]).toMatchObject({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        id: '1234567890-test-id'
      })
    })

    it('should aggregate metrics by name correctly', () => {
      const testMetrics = [
        { name: 'LCP' as const, value: 2000, rating: 'good' as const, id: '1000-1' },
        { name: 'LCP' as const, value: 2500, rating: 'good' as const, id: '1001-2' },
        { name: 'LCP' as const, value: 3000, rating: 'needs-improvement' as const, id: '1002-3' },
        { name: 'CLS' as const, value: 0.05, rating: 'good' as const, id: '1003-4' },
        { name: 'CLS' as const, value: 0.15, rating: 'needs-improvement' as const, id: '1004-5' },
      ]

      testMetrics.forEach(m => collector.recordWebVital(m))

      const metrics = collector.getWebVitalsMetrics()

      expect(metrics.byMetricName['LCP']).toEqual({
        count: 3,
        avg: 2500,
        min: 2000,
        max: 3000
      })
      expect(metrics.byMetricName['CLS']).toEqual({
        count: 2,
        avg: 0.1,
        min: 0.05,
        max: 0.15
      })
    })

    it('should calculate percentile values correctly', () => {
      for (let i = 0; i < 10; i++) {
        collector.recordWebVital({
          name: 'LCP',
          value: (i + 1) * 100,
          rating: 'good',
          id: `100${i}-${i}`
        })
      }

      const metrics = collector.getWebVitalsMetrics()
      const lcp = metrics.byMetricName['LCP']

      expect(lcp).toBeDefined()
      expect(lcp.count).toBe(10)
      expect(lcp.min).toBe(100)
      expect(lcp.max).toBe(1000)
      expect(lcp.avg).toBe(550)
    })
  })

  describe('performanceMetricsCollector singleton', () => {
    it('should be a singleton instance', () => {
      expect(performanceMetricsCollector).toBeInstanceOf(PerformanceMetricsCollector)
    })

    it('should maintain state across multiple recordings', () => {
      performanceMetricsCollector.recordWebVital({
        name: 'TTFB',
        value: 500,
        rating: 'good',
        id: 'test-ttfb-1'
      })
      performanceMetricsCollector.recordWebVital({
        name: 'TTFB',
        value: 800,
        rating: 'good',
        id: 'test-ttfb-2'
      })
      performanceMetricsCollector.recordWebVital({
        name: 'INP',
        value: 50,
        rating: 'good',
        id: 'test-inp-1'
      })

      const metrics = performanceMetricsCollector.getWebVitalsMetrics()

      expect(metrics.events.length).toBeGreaterThanOrEqual(3)
      expect(metrics.byMetricName['TTFB'].count).toBeGreaterThanOrEqual(2)
      expect(metrics.byMetricName['INP'].count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('clear functionality', () => {
    it('should clear all web vital metrics', () => {
      collector.recordWebVital({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        id: 'test-clear-1'
      })
      collector.recordWebVital({
        name: 'CLS',
        value: 0.1,
        rating: 'good',
        id: 'test-clear-2'
      })

      collector.clear()
      telemetryCollector.clear()

      const metrics = collector.getWebVitalsMetrics()
      expect(metrics.events).toHaveLength(0)
      expect(metrics.byMetricName).toEqual({})
    })
  })

  describe('rating calculations', () => {
    it('should record good, needs-improvement, and poor ratings', () => {
      const metrics = [
        { name: 'LCP' as const, value: 1500, rating: 'good' as const, id: 'good-lcp' },
        { name: 'LCP' as const, value: 3000, rating: 'needs-improvement' as const, id: 'ni-lcp' },
        { name: 'LCP' as const, value: 5000, rating: 'poor' as const, id: 'poor-lcp' },
      ]

      metrics.forEach(m => collector.recordWebVital(m))

      const result = collector.getWebVitalsMetrics()
      
      expect(result.events).toHaveLength(3)
      expect(result.events.filter(e => e.rating === 'good')).toHaveLength(1)
      expect(result.events.filter(e => e.rating === 'needs-improvement')).toHaveLength(1)
      expect(result.events.filter(e => e.rating === 'poor')).toHaveLength(1)
    })
  })

  describe('different metric types', () => {
    it('should handle all Core Web Vitals metric types', () => {
      const coreWebVitals = [
        { name: 'FCP' as const, value: 1000, rating: 'good' as const, id: 'fcp-1' },
        { name: 'LCP' as const, value: 2000, rating: 'good' as const, id: 'lcp-1' },
        { name: 'TTFB' as const, value: 500, rating: 'good' as const, id: 'ttfb-1' },
        { name: 'CLS' as const, value: 0.05, rating: 'good' as const, id: 'cls-1' },
        { name: 'INP' as const, value: 100, rating: 'good' as const, id: 'inp-1' },
      ]

      coreWebVitals.forEach(m => collector.recordWebVital(m))

      const metrics = collector.getWebVitalsMetrics()

      expect(metrics.events).toHaveLength(5)
      expect(metrics.byMetricName).toHaveProperty('FCP')
      expect(metrics.byMetricName).toHaveProperty('LCP')
      expect(metrics.byMetricName).toHaveProperty('TTFB')
      expect(metrics.byMetricName).toHaveProperty('CLS')
      expect(metrics.byMetricName).toHaveProperty('INP')
    })
  })
})

describe('Web Vitals Thresholds', () => {
  interface MetricThresholds {
    good: number
    needsImprovement: number
    poor: number
  }

  const METRIC_THRESHOLDS: Record<string, MetricThresholds> = {
    LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
    FID: { good: 100, needsImprovement: 300, poor: 300 },
    INP: { good: 200, needsImprovement: 500, poor: 500 },
    CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
    TTFB: { good: 800, needsImprovement: 1800, poor: 1800 },
    FCP: { good: 1800, needsImprovement: 3000, poor: 3000 },
  }

  function getRating(value: number, metricName: string): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = METRIC_THRESHOLDS[metricName] || { good: Infinity, needsImprovement: Infinity, poor: Infinity }
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.needsImprovement) return 'needs-improvement'
    return 'poor'
  }

  it('should classify LCP correctly based on thresholds', () => {
    expect(getRating(2000, 'LCP')).toBe('good')
    expect(getRating(3000, 'LCP')).toBe('needs-improvement')
    expect(getRating(5000, 'LCP')).toBe('poor')
  })

  it('should classify CLS correctly based on thresholds', () => {
    expect(getRating(0.05, 'CLS')).toBe('good')
    expect(getRating(0.2, 'CLS')).toBe('needs-improvement')
    expect(getRating(0.3, 'CLS')).toBe('poor')
  })

  it('should classify TTFB correctly based on thresholds', () => {
    expect(getRating(500, 'TTFB')).toBe('good')
    expect(getRating(1000, 'TTFB')).toBe('needs-improvement')
    expect(getRating(2000, 'TTFB')).toBe('poor')
  })

  it('should classify FID/INP correctly based on thresholds', () => {
    expect(getRating(50, 'FID' as any)).toBe('good')
    expect(getRating(200, 'FID' as any)).toBe('needs-improvement')
    expect(getRating(400, 'FID' as any)).toBe('poor')
  })

  it('should have correct threshold values', () => {
    expect(METRIC_THRESHOLDS.LCP.good).toBe(2500)
    expect(METRIC_THRESHOLDS.CLS.good).toBe(0.1)
    expect(METRIC_THRESHOLDS.TTFB.good).toBe(800)
    expect(METRIC_THRESHOLDS.FID.good).toBe(100)
    expect(METRIC_THRESHOLDS.INP.good).toBe(200)
    expect(METRIC_THRESHOLDS.FCP.good).toBe(1800)
  })
})
