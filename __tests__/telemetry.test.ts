import { TelemetryCollector } from '@/lib/api/telemetry'

describe('TelemetryCollector with Trace Context', () => {
  let collector: TelemetryCollector

  beforeEach(() => {
    collector = new TelemetryCollector({ enabled: true, maxEvents: 100 })
  })

  afterEach(() => {
    collector.destroy()
  })

  describe('record()', () => {
    it('should record telemetry events with trace context', () => {
      collector.record({
        type: 'api-request',
        category: 'api-request',
        data: {
          method: 'GET',
          endpoint: '/wp/v2/posts',
          statusCode: 200,
        },
      })

      const events = collector.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('api-request')
      expect(events[0].category).toBe('api-request')
      expect(events[0].data).toEqual({
        method: 'GET',
        endpoint: '/wp/v2/posts',
        statusCode: 200,
      })
    })

    it('should filter events by type', () => {
      collector.record({ type: 'api-request', category: 'api-request', data: {} })
      collector.record({ type: 'circuit-breaker', category: 'circuit-breaker', data: {} })
      collector.record({ type: 'api-request', category: 'api-request', data: {} })

      const apiEvents = collector.getEventsByType('api-request')
      expect(apiEvents).toHaveLength(2)
    })

    it('should filter events by category', () => {
      collector.record({ type: 'api-request', category: 'api-request', data: {} })
      collector.record({ type: 'state-change', category: 'circuit-breaker', data: {} })
      collector.record({ type: 'retry', category: 'retry', data: {} })

      const circuitBreakerEvents = collector.getEventsByCategory('circuit-breaker')
      expect(circuitBreakerEvents).toHaveLength(1)
    })

    it('should track statistics', () => {
      collector.record({ type: 'api-request', category: 'api-request', data: {} })
      collector.record({ type: 'api-request', category: 'api-request', data: {} })
      collector.record({ type: 'success', category: 'circuit-breaker', data: {} })

      const stats = collector.getStats()
      expect(stats['api-request.api-request']).toBe(2)
      expect(stats['circuit-breaker.success']).toBe(1)
    })
  })

  describe('flush()', () => {
    it('should flush all events and return them', () => {
      collector.record({ type: 'api-request', category: 'api-request', data: {} })
      collector.record({ type: 'success', category: 'circuit-breaker', data: {} })

      const flushed = collector.flush()
      expect(flushed).toHaveLength(2)
      expect(collector.getEvents()).toHaveLength(0)
    })
  })

  describe('clear()', () => {
    it('should clear all events and reset stats', () => {
      collector.record({ type: 'api-request', category: 'api-request', data: {} })
      collector.record({ type: 'success', category: 'circuit-breaker', data: {} })

      collector.clear()
      expect(collector.getEvents()).toHaveLength(0)
      expect(collector.getStats()).toEqual({})
    })
  })
})

describe('enrichWithTraceContext', () => {
  it('should add trace context to data', () => {
    const { enrichWithTraceContext } = require('@/lib/api/telemetry')

    const data = { method: 'GET', endpoint: '/wp/v2/posts' }
    const enriched = enrichWithTraceContext(data)

    expect(enriched).toMatchObject({
      method: 'GET',
      endpoint: '/wp/v2/posts',
    })
  })
})