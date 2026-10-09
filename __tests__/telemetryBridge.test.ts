import {
  createSentryBridgeHandler,
  flushAggregateToSentry,
  startAggregateFlush,
} from '@/lib/api/telemetryBridge'
import type { TelemetryEvent } from '@/lib/api/telemetry'

function makeEvent(category: TelemetryEvent['category'], type: string): TelemetryEvent {
  return {
    timestamp: new Date().toISOString(),
    type,
    category,
    data: { endpoint: '/wp/v2/posts' },
  }
}

describe('Telemetry Sentry bridge (PERF-MON-002)', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    delete process.env.SENTRY_DSN
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('is a no-op without DSN (never imports Sentry)', async () => {
    const handler = createSentryBridgeHandler({ sampleRate: 1 })
    expect(() => handler(makeEvent('api-request', 'success'))).not.toThrow()
    await flushAggregateToSentry([{ category: 'api-request', type: 'success', count: 5 }])
  })

  test('always forwards high-signal events at sampleRate 0', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    const addBreadcrumb = jest.fn()
    jest.doMock('@sentry/nextjs', () => ({
      __esModule: true,
      addBreadcrumb,
      captureMessage: jest.fn(),
    }))

    const handler = createSentryBridgeHandler({ sampleRate: 0 })
    handler(makeEvent('circuit-breaker', 'state-change'))
    handler(makeEvent('health-check', 'unhealthy'))
    handler(makeEvent('retry', 'retry-exhausted'))

    // Lazy dynamic import resolves on microtask queue.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(addBreadcrumb).toHaveBeenCalledTimes(3)
  })

  test('drops routine events at sampleRate 0', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    const addBreadcrumb = jest.fn()
    jest.doMock('@sentry/nextjs', () => ({
      __esModule: true,
      addBreadcrumb,
      captureMessage: jest.fn(),
    }))

    const handler = createSentryBridgeHandler({ sampleRate: 0 })
    handler(makeEvent('api-request', 'success'))
    handler(makeEvent('performance', 'api-response-time'))

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(addBreadcrumb).not.toHaveBeenCalled()
  })

  test('startAggregateFlush returns working stop function and is inert in test env', () => {
    const stop = startAggregateFlush(() => ({ 'api-request.success': 3 }), { flushIntervalMs: 50 })
    expect(typeof stop).toBe('function')
    stop()
  })

  test('flushAggregateToSentry is a no-op for empty aggregates', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    await expect(flushAggregateToSentry([])).resolves.toBeUndefined()
  })
})
