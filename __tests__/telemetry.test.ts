import {
  telemetryCollector,
  TelemetryCollector
} from '@/lib/api/telemetry'
import type {
  CircuitBreakerTelemetry,
  RetryTelemetry,
  RateLimitTelemetry,
  HealthCheckTelemetry,
  ApiRequestTelemetry
} from '@/lib/api/telemetry'

describe('TelemetryCollector', () => {
  afterEach(() => {
    telemetryCollector.clear()
  })

  describe('constructor', () => {
    it('should create collector with default config', () => {
      const collector = new TelemetryCollector()
      expect(collector).toBeDefined()
      collector.destroy()
    })

    it('should create collector with custom config', () => {
      const collector = new TelemetryCollector({
        enabled: false,
        maxEvents: 100
      })
      expect(collector).toBeDefined()
      collector.destroy()
    })
  })

  describe('record', () => {
    it('should record event when enabled', () => {
      const collector = new TelemetryCollector({
        enabled: true
      })

      collector.record({
        type: 'test',
        category: 'api-request',
        data: { test: true }
      })

      const events = collector.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('test')
      expect(events[0].category).toBe('api-request')
      expect(events[0].data).toEqual({ test: true })
      expect(events[0].timestamp).toBeDefined()

      collector.destroy()
    })

    it('should not record event when disabled', () => {
      const collector = new TelemetryCollector({ enabled: false })

      collector.record({
        type: 'test',
        category: 'api-request',
        data: { test: true }
      })

      const events = collector.getEvents()
      expect(events).toHaveLength(0)

      collector.destroy()
    })

    it('should auto-flush when max events reached', () => {
      const collector = new TelemetryCollector({ enabled: true, maxEvents: 3 })

      for (let i = 0; i < 5; i++) {
        collector.record({
          type: 'test',
          category: 'api-request',
          data: { index: i }
        })
      }

      const events = collector.getEvents()
      expect(events.length).toBeLessThanOrEqual(3)
      collector.destroy()
    })
  })

  describe('getEvents', () => {
    it('should return copy of events', () => {
      telemetryCollector.record({ type: 'test', category: 'api-request', data: {} })

      const events1 = telemetryCollector.getEvents()
      const events2 = telemetryCollector.getEvents()

      expect(events1).toEqual(events2)
      expect(events1).not.toBe(events2)
    })
  })

  describe('getEventsByType', () => {
    it('should filter events by type', () => {
      telemetryCollector.record({ type: 'test1', category: 'api-request', data: {} })
      telemetryCollector.record({ type: 'test2', category: 'api-request', data: {} })
      telemetryCollector.record({ type: 'test1', category: 'api-request', data: {} })

      const events = telemetryCollector.getEventsByType('test1')
      expect(events).toHaveLength(2)
      expect(events.every((e) => e.type === 'test1')).toBe(true)
    })

    it('should return empty array for non-existent type', () => {
      const events = telemetryCollector.getEventsByType('nonexistent')
      expect(events).toEqual([])
    })
  })

  describe('getEventsByCategory', () => {
    it('should filter events by category', () => {
      telemetryCollector.record({ type: 'test', category: 'circuit-breaker', data: {} })
      telemetryCollector.record({ type: 'test', category: 'retry', data: {} })
      telemetryCollector.record({ type: 'test', category: 'circuit-breaker', data: {} })

      const events = telemetryCollector.getEventsByCategory('circuit-breaker')
      expect(events).toHaveLength(2)
      expect(events.every((e) => e.category === 'circuit-breaker')).toBe(true)
    })

    it('should return empty array for non-existent category', () => {
      const events = telemetryCollector.getEventsByCategory('nonexistent' as any)
      expect(events).toEqual([])
    })
  })

  describe('clear', () => {
    it('should clear all events', () => {
      telemetryCollector.record({ type: 'test', category: 'api-request', data: {} })
      expect(telemetryCollector.getEvents()).toHaveLength(1)

      telemetryCollector.clear()
      expect(telemetryCollector.getEvents()).toHaveLength(0)
    })
  })

  describe('flush', () => {
    it('should return and clear events', () => {
      telemetryCollector.record({ type: 'test1', category: 'api-request', data: {} })
      telemetryCollector.record({ type: 'test2', category: 'api-request', data: {} })

      const flushed = telemetryCollector.flush()
      expect(flushed).toHaveLength(2)
      expect(telemetryCollector.getEvents()).toHaveLength(0)
    })

    it('should return empty array when no events', () => {
      const flushed = telemetryCollector.flush()
      expect(flushed).toEqual([])
    })
  })

  describe('getStats', () => {
    it('should return event counts by type and category', () => {
      telemetryCollector.record({ type: 'test1', category: 'circuit-breaker', data: {} })
      telemetryCollector.record({ type: 'test1', category: 'circuit-breaker', data: {} })
      telemetryCollector.record({ type: 'test', category: 'retry', data: {} })

      const stats = telemetryCollector.getStats()
      expect(stats['circuit-breaker.test1']).toBe(2)
      expect(stats['retry.test']).toBe(1)
    })

    it('should return empty object when no events', () => {
      const stats = telemetryCollector.getStats()
      expect(stats).toEqual({})
    })
  })

  describe('destroy', () => {
    it('should clear events and stop flush timer', () => {
      const collector = new TelemetryCollector({
        enabled: true,
        flushInterval: 1000
      })

      collector.record({ type: 'test', category: 'api-request', data: {} })
      expect(collector.getEvents()).toHaveLength(1)

      collector.destroy()
      expect(collector.getEvents()).toHaveLength(0)
    })
  })

  describe('Circuit Breaker Telemetry', () => {
    beforeEach(() => {
      telemetryCollector.clear()
    })

    describe('recordCircuitBreakerStateChange', () => {
      it('should record state change event', () => {
        telemetryCollector.record({
          type: 'state-change',
          category: 'circuit-breaker',
          data: {
            state: 'OPEN',
            failureCount: 5,
            successCount: 0,
            lastFailureTime: Date.now(),
            nextAttemptTime: Date.now() + 60000,
            endpoint: '/wp/v2/posts'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('state-change')
        expect(events[0].category).toBe('circuit-breaker')
        expect(events[0].data).toMatchObject({
          state: 'OPEN',
          failureCount: 5,
          successCount: 0,
          endpoint: '/wp/v2/posts'
        })
      })
    })

    describe('recordCircuitBreakerFailure', () => {
      it('should record failure event', () => {
        telemetryCollector.record({
          type: 'failure',
          category: 'circuit-breaker',
          data: {
            state: 'CLOSED',
            failureCount: 3,
            successCount: 0,
            lastFailureTime: Date.now(),
            nextAttemptTime: null,
            endpoint: '/wp/v2/posts'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('failure')
        expect(events[0].category).toBe('circuit-breaker')
      })
    })

    describe('recordCircuitBreakerSuccess', () => {
      it('should record success event', () => {
        telemetryCollector.record({
          type: 'success',
          category: 'circuit-breaker',
          data: {
            state: 'CLOSED',
            failureCount: 2,
            successCount: 1,
            lastFailureTime: null,
            nextAttemptTime: null,
            endpoint: '/wp/v2/posts'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('success')
        expect(events[0].category).toBe('circuit-breaker')
      })
    })
  })

  describe('Retry Telemetry', () => {
    beforeEach(() => {
      telemetryCollector.clear()
    })

    describe('recordRetry', () => {
      it('should record retry event', () => {
        telemetryCollector.record({
          type: 'retry',
          category: 'retry',
          data: {
            attempt: 1,
            maxRetries: 3,
            delay: 1000,
            errorType: 'NETWORK_ERROR',
            endpoint: '/wp/v2/posts'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('retry')
        expect(events[0].category).toBe('retry')
        expect(events[0].data).toEqual({
          attempt: 1,
          maxRetries: 3,
          delay: 1000,
          errorType: 'NETWORK_ERROR',
          endpoint: '/wp/v2/posts'
        })
      })
    })

    describe('recordRetrySuccess', () => {
      it('should record retry success event', () => {
        telemetryCollector.record({
          type: 'retry-success',
          category: 'retry',
          data: {
            attempt: 2,
            maxRetries: 3,
            delay: 2000,
            errorType: 'NETWORK_ERROR',
            endpoint: '/wp/v2/posts'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('retry-success')
        expect(events[0].category).toBe('retry')
      })
    })

    describe('recordRetryExhausted', () => {
      it('should record retry exhausted event', () => {
        telemetryCollector.record({
          type: 'retry-exhausted',
          category: 'retry',
          data: {
            attempt: 3,
            maxRetries: 3,
            delay: 4000,
            errorType: 'TIMEOUT_ERROR',
            endpoint: '/wp/v2/posts'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('retry-exhausted')
        expect(events[0].category).toBe('retry')
      })
    })
  })

  describe('Rate Limit Telemetry', () => {
    beforeEach(() => {
      telemetryCollector.clear()
    })

    describe('recordRateLimitExceeded', () => {
      it('should record rate limit exceeded event', () => {
        telemetryCollector.record({
          type: 'exceeded',
          category: 'rate-limit',
          data: {
            limit: 60,
            remaining: 0,
            resetTime: Date.now() + 60000,
            windowMs: 60000,
            key: 'user-123'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('exceeded')
        expect(events[0].category).toBe('rate-limit')
      })
    })

    describe('recordRateLimitReset', () => {
      it('should record rate limit reset event', () => {
        telemetryCollector.record({
          type: 'reset',
          category: 'rate-limit',
          data: {
            limit: 60,
            remaining: 60,
            resetTime: Date.now() + 60000,
            windowMs: 60000,
            key: 'user-123'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('reset')
        expect(events[0].category).toBe('rate-limit')
      })
    })
  })

  describe('Health Check Telemetry', () => {
    beforeEach(() => {
      telemetryCollector.clear()
    })

    describe('recordHealthCheck', () => {
      it('should record healthy health check', () => {
        telemetryCollector.record({
          type: 'healthy',
          category: 'health-check',
          data: {
            healthy: true,
            latency: 123,
            endpoint: '/wp/v2/',
            version: 'v2'
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('healthy')
        expect(events[0].category).toBe('health-check')
        expect(events[0].data).toEqual({
          healthy: true,
          latency: 123,
          endpoint: '/wp/v2/',
          version: 'v2',
          error: undefined
        })
      })
    })

    it('should record unhealthy health check', () => {
      telemetryCollector.record({
        type: 'unhealthy',
        category: 'health-check',
        data: {
          healthy: false,
          latency: 5000,
          endpoint: '/wp/v2/',
          error: 'Connection refused'
        }
      })

      const events = telemetryCollector.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('unhealthy')
      expect(events[0].category).toBe('health-check')
    })
  })

  describe('API Request Telemetry', () => {
    beforeEach(() => {
      telemetryCollector.clear()
    })

    describe('recordApiRequest', () => {
      it('should record successful API request', () => {
        telemetryCollector.record({
          type: 'request',
          category: 'api-request',
          data: {
            method: 'GET',
            endpoint: '/wp/v2/posts',
            statusCode: 200,
            duration: 123,
            cacheHit: true,
            retryCount: 0
          }
        })

        const events = telemetryCollector.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('request')
        expect(events[0].category).toBe('api-request')
      })
    })

    it('should record failed API request', () => {
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: {
          method: 'GET',
          endpoint: '/wp/v2/posts',
          statusCode: 500,
          duration: 456,
          cacheHit: false,
          retryCount: 3,
          errorType: 'SERVER_ERROR'
        }
      })

      const events = telemetryCollector.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('request')
    })
  })
})
