import type { TelemetryEvent } from './telemetry'
import { logger } from '@/lib/utils/logger'

/**
 * PERF-MON-002: APM export bridge for the in-memory TelemetryCollector.
 *
 * Design decisions (documented, reversible):
 * - Provider is Sentry (@sentry/nextjs, already installed) — no new
 *   credentials required. The bridge is a no-op when no DSN is configured.
 * - Event-level export is SAMPLED (default 10%) to bound APM volume.
 *   High-signal events (circuit-breaker state changes, unhealthy checks,
 *   retry exhaustion) bypass sampling and are always forwarded.
 * - A periodic aggregate flush (default every 60s) sends per-category counts
 *   as a single Sentry message — dashboards/alerts should key off these.
 * - Sentry is imported lazily inside the handlers so unit tests and
 *   environments without the SDK never pay import cost or crash.
 */

export interface TelemetryBridgeConfig {
  /** Fraction of routine events to forward (0–1). Default 0.1. */
  sampleRate?: number
  /** Aggregate flush interval in ms. Default 60000. Set 0 to disable. */
  flushIntervalMs?: number
}

const ALWAYS_FORWARD: Array<{ category: TelemetryEvent['category']; type: string }> = [
  { category: 'circuit-breaker', type: 'state-change' },
  { category: 'circuit-breaker', type: 'failure' },
  { category: 'health-check', type: 'unhealthy' },
  { category: 'retry', type: 'retry-exhausted' },
]

function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
}

function shouldForward(event: TelemetryEvent, sampleRate: number): boolean {
  if (ALWAYS_FORWARD.some((rule) => rule.category === event.category && rule.type === event.type)) {
    return true
  }
  return Math.random() < sampleRate
}

async function forwardEvent(event: TelemetryEvent): Promise<void> {
  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.addBreadcrumb({
      category: `telemetry.${event.category}`,
      message: event.type,
      data: event.data as Record<string, unknown>,
      level: 'info',
      timestamp: Date.parse(event.timestamp) / 1000 || undefined,
    })
  } catch (error) {
    logger.warn('Telemetry Sentry bridge failed to forward event', error, { module: 'telemetryBridge' })
  }
}

/**
 * onEvent-compatible handler: call as
 *   new TelemetryCollector({ enabled: true, onEvent: createSentryBridge() })
 * or attach to the singleton via setOnEvent (see below).
 */
export function createSentryBridgeHandler(config: TelemetryBridgeConfig = {}) {
  const sampleRate = config.sampleRate ?? 0.1
  return (event: TelemetryEvent): void => {
    if (!isSentryEnabled()) return
    if (!shouldForward(event, sampleRate)) return
    void forwardEvent(event)
  }
}

export interface TelemetryAggregate {
  category: TelemetryEvent['category']
  type: string
  count: number
}

/**
 * Forward a periodic aggregate snapshot (e.g. from telemetryCollector.getStats())
 * as one Sentry message. Keeps dashboard cardinality low.
 */
export async function flushAggregateToSentry(aggregates: TelemetryAggregate[]): Promise<void> {
  if (!isSentryEnabled() || aggregates.length === 0) return
  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureMessage('telemetry.aggregate', {
      level: 'info',
      extra: {
        aggregates,
        window: 'flush-interval',
      },
    })
  } catch (error) {
    logger.warn('Telemetry Sentry bridge failed to flush aggregate', error, { module: 'telemetryBridge' })
  }
}

/**
 * Start periodic aggregate flushing driven by a stats provider callback.
 * Returns a stop function. Timer is unref'd so it never blocks exit.
 */
export function startAggregateFlush(
  getStats: () => Record<string, number>,
  config: TelemetryBridgeConfig = {}
): () => void {
  const intervalMs = config.flushIntervalMs ?? 60000
  if (!intervalMs || intervalMs <= 0 || process.env.NODE_ENV === 'test') {
    return () => {}
  }
  const timer = setInterval(() => {
    const stats = getStats()
    const aggregates: TelemetryAggregate[] = Object.entries(stats).map(([key, count]) => {
      const [category, ...rest] = key.split('.')
      return {
        category: category as TelemetryEvent['category'],
        type: rest.join('.'),
        count,
      }
    })
    void flushAggregateToSentry(aggregates)
  }, intervalMs)
  if (typeof timer.unref === 'function') {
    timer.unref()
  }
  return () => clearInterval(timer)
}
