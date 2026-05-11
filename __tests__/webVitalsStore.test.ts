import { WebVitalsStore, webVitalsStore } from '@/lib/api/webVitalsStore'
import type { WebVitalsReport } from '@/lib/api/webVitalsStore'

describe('WebVitalsStore', () => {
  afterEach(() => {
    webVitalsStore.clear()
  })

  describe('constructor', () => {
    it('should initialize with all metric types', () => {
      const store = new WebVitalsStore()
      const metrics = store.getAggregatedMetrics()
      expect(Object.keys(metrics)).toContain('FCP')
      expect(Object.keys(metrics)).toContain('LCP')
      expect(Object.keys(metrics)).toContain('TTFB')
      expect(Object.keys(metrics)).toContain('CLS')
      expect(Object.keys(metrics)).toContain('INP')
    })
  })

  describe('record', () => {
    it('should record a valid web vital', () => {
      const metric: WebVitalsReport = {
        name: 'LCP',
        value: 1200,
        rating: 'good',
        id: 'test-id-1'
      }

      webVitalsStore.record(metric)
      const metrics = webVitalsStore.getAggregatedMetrics()

      expect(metrics.LCP.count).toBe(1)
      expect(metrics.LCP.min).toBe(1200)
      expect(metrics.LCP.max).toBe(1200)
    })

    it('should record multiple metrics', () => {
      const metrics: WebVitalsReport[] = [
        { name: 'LCP', value: 1000, rating: 'good', id: 'id-1' },
        { name: 'LCP', value: 1500, rating: 'needs-improvement', id: 'id-2' },
        { name: 'FCP', value: 800, rating: 'good', id: 'id-3' }
      ]

      for (const m of metrics) {
        webVitalsStore.record(m)
      }

      const result = webVitalsStore.getAggregatedMetrics()
      expect(result.LCP.count).toBe(2)
      expect(result.FCP.count).toBe(1)
    })

    it('should track ratings', () => {
      const metrics: WebVitalsReport[] = [
        { name: 'CLS', value: 0.1, rating: 'good', id: 'id-1' },
        { name: 'CLS', value: 0.2, rating: 'needs-improvement', id: 'id-2' },
        { name: 'CLS', value: 0.3, rating: 'poor', id: 'id-3' }
      ]

      for (const m of metrics) {
        webVitalsStore.record(m)
      }

      const result = webVitalsStore.getAggregatedMetrics()
      expect(result.CLS.ratings.good).toBe(1)
      expect(result.CLS.ratings['needs-improvement']).toBe(1)
      expect(result.CLS.ratings.poor).toBe(1)
    })
  })

  describe('getAggregatedMetrics', () => {
    it('should return zero values for empty store', () => {
      const metrics = webVitalsStore.getAggregatedMetrics()

      expect(metrics.LCP.count).toBe(0)
      expect(metrics.LCP.p75).toBe(0)
      expect(metrics.LCP.p90).toBe(0)
      expect(metrics.LCP.p99).toBe(0)
    })

    it('should calculate percentiles correctly', () => {
      for (let i = 1; i <= 100; i++) {
        webVitalsStore.record({
          name: 'LCP',
          value: i * 10,
          rating: 'good',
          id: `id-${i}`
        })
      }

      const metrics = webVitalsStore.getAggregatedMetrics()
      expect(metrics.LCP.p75).toBe(760)
      expect(metrics.LCP.p90).toBe(910)
      expect(metrics.LCP.p99).toBe(1000)
    })

    it('should calculate average correctly', () => {
      webVitalsStore.record({ name: 'INP', value: 100, rating: 'good', id: 'id-1' })
      webVitalsStore.record({ name: 'INP', value: 200, rating: 'good', id: 'id-2' })
      webVitalsStore.record({ name: 'INP', value: 300, rating: 'good', id: 'id-3' })

      const metrics = webVitalsStore.getAggregatedMetrics()
      expect(metrics.INP.avg).toBe(200)
    })

    it('should calculate min and max correctly', () => {
      webVitalsStore.record({ name: 'FCP', value: 500, rating: 'good', id: 'id-1' })
      webVitalsStore.record({ name: 'FCP', value: 1000, rating: 'needs-improvement', id: 'id-2' })
      webVitalsStore.record({ name: 'FCP', value: 200, rating: 'good', id: 'id-3' })

      const metrics = webVitalsStore.getAggregatedMetrics()
      expect(metrics.FCP.min).toBe(200)
      expect(metrics.FCP.max).toBe(1000)
    })
  })

  describe('clear', () => {
    it('should clear all recorded metrics', () => {
      webVitalsStore.record({ name: 'LCP', value: 1000, rating: 'good', id: 'id-1' })
      webVitalsStore.record({ name: 'FCP', value: 500, rating: 'good', id: 'id-2' })

      webVitalsStore.clear()

      const metrics = webVitalsStore.getAggregatedMetrics()
      expect(metrics.LCP.count).toBe(0)
      expect(metrics.FCP.count).toBe(0)
    })
  })

  describe('TTL and invalid metrics', () => {
    it('should handle unknown metric names gracefully', () => {
      const store = new WebVitalsStore()
      store.record({
        name: 'UNKNOWN' as WebVitalsReport['name'],
        value: 100,
        rating: 'good',
        id: 'id-1'
      })

      const metrics = store.getAggregatedMetrics()
      expect(metrics.UNKNOWN).toBeUndefined()
    })
  })
})