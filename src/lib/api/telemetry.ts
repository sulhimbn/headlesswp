import { logger } from '@/lib/utils/logger'

export interface TelemetryEvent {
  timestamp: string
  type: string
  category: 'circuit-breaker' | 'retry' | 'rate-limit' | 'health-check' | 'api-request'
  data: Record<string, unknown>
}

export interface TelemetryConfig {
  enabled: boolean
  maxEvents?: number
  flushInterval?: number
  onEvent?: (event: TelemetryEvent) => void
}

export class TelemetryCollector {
  private events: TelemetryEvent[] = []
  private config: TelemetryConfig
  private flushTimer?: NodeJS.Timeout

  constructor(config: TelemetryConfig = { enabled: true }) {
    this.config = {
      ...config,
      maxEvents: config.maxEvents ?? 1000
    }

    if (this.config.flushInterval && this.config.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush()
      }, this.config.flushInterval)
    }
  }

  record(event: Omit<TelemetryEvent, 'timestamp'>): void {
    if (!this.config.enabled) return

    const telemetryEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    this.events.push(telemetryEvent)
    this.config.onEvent?.(telemetryEvent)

    if (this.events.length >= (this.config.maxEvents ?? 1000)) {
      logger.warn(`Telemetry buffer full (${this.events.length}/${this.config.maxEvents ?? 1000}), flushing...`)
      this.flush()
    }
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  getEventsByType(type: string): TelemetryEvent[] {
    return this.events.filter((e) => e.type === type)
  }

  getEventsByCategory(category: TelemetryEvent['category']): TelemetryEvent[] {
    return this.events.filter((e) => e.category === category)
  }

  clear(): void {
    this.events = []
  }

  flush(): TelemetryEvent[] {
    const flushed = [...this.events]
    this.events = []
    return flushed
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.clear()
  }

  getStats(): Record<string, number> {
    const stats: Record<string, number> = {}

    this.events.forEach((event) => {
      const key = `${event.category}.${event.type}`
      stats[key] = (stats[key] || 0) + 1
    })

    return stats
  }
}

export const telemetryCollector = new TelemetryCollector({
  enabled: process.env.TELEMETRY_ENABLED !== 'false',
  maxEvents: 1000,
  flushInterval: 60000
})

export interface CircuitBreakerTelemetry {
  state: string
  failureCount: number
  successCount: number
  lastFailureTime: number | null
  nextAttemptTime: number | null
  endpoint?: string
}

export const recordCircuitBreakerStateChange = (data: CircuitBreakerTelemetry): void => {
  telemetryCollector.record({
    type: 'state-change',
    category: 'circuit-breaker',
    data: {
      state: data.state,
      failureCount: data.failureCount,
      successCount: data.successCount,
      endpoint: data.endpoint
    }
  })
}

export const recordCircuitBreakerFailure = (data: CircuitBreakerTelemetry): void => {
  telemetryCollector.record({
    type: 'failure',
    category: 'circuit-breaker',
    data: {
      failureCount: data.failureCount,
      endpoint: data.endpoint
    }
  })
}

export const recordCircuitBreakerSuccess = (data: CircuitBreakerTelemetry): void => {
  telemetryCollector.record({
    type: 'success',
    category: 'circuit-breaker',
    data: {
      state: data.state,
      successCount: data.successCount,
      endpoint: data.endpoint
    }
  })
}

export const recordCircuitBreakerRequestBlocked = (data: CircuitBreakerTelemetry): void => {
  telemetryCollector.record({
    type: 'request-blocked',
    category: 'circuit-breaker',
    data: {
      state: data.state,
      nextAttemptTime: data.nextAttemptTime,
      endpoint: data.endpoint
    }
  })
}

export interface RetryTelemetry {
  attempt: number
  maxRetries: number
  delay: number
  errorType: string
  endpoint?: string
}

export const recordRetry = (data: RetryTelemetry): void => {
  telemetryCollector.record({
    type: 'retry',
    category: 'retry',
    data: {
      attempt: data.attempt,
      maxRetries: data.maxRetries,
      delay: data.delay,
      errorType: data.errorType,
      endpoint: data.endpoint
    }
  })
}

export const recordRetrySuccess = (data: RetryTelemetry): void => {
  telemetryCollector.record({
    type: 'retry-success',
    category: 'retry',
    data: {
      attempt: data.attempt,
      endpoint: data.endpoint
    }
  })
}

export const recordRetryExhausted = (data: RetryTelemetry): void => {
  telemetryCollector.record({
    type: 'retry-exhausted',
    category: 'retry',
    data: {
      attempt: data.attempt,
      maxRetries: data.maxRetries,
      errorType: data.errorType,
      endpoint: data.endpoint
    }
  })
}

export interface RateLimitTelemetry {
  limit: number
  remaining: number
  resetTime: number
  windowMs: number
  key?: string
}

export const recordRateLimitExceeded = (data: RateLimitTelemetry): void => {
  telemetryCollector.record({
    type: 'exceeded',
    category: 'rate-limit',
    data: {
      limit: data.limit,
      remaining: data.remaining,
      resetTime: data.resetTime,
      windowMs: data.windowMs,
      key: data.key
    }
  })
}

export const recordRateLimitReset = (data: RateLimitTelemetry): void => {
  telemetryCollector.record({
    type: 'reset',
    category: 'rate-limit',
    data: {
      key: data.key
    }
  })
}

export interface HealthCheckTelemetry {
  healthy: boolean
  latency: number
  endpoint?: string
  version?: string
  error?: string
}

export const recordHealthCheck = (data: HealthCheckTelemetry): void => {
  telemetryCollector.record({
    type: data.healthy ? 'healthy' : 'unhealthy',
    category: 'health-check',
    data: {
      healthy: data.healthy,
      latency: data.latency,
      endpoint: data.endpoint,
      version: data.version,
      error: data.error
    }
  })
}

export interface ApiRequestTelemetry {
  method: string
  endpoint: string
  statusCode: number
  duration: number
  cacheHit?: boolean
  retryCount?: number
  errorType?: string
}

export const recordApiRequest = (data: ApiRequestTelemetry): void => {
  telemetryCollector.record({
    type: 'request',
    category: 'api-request',
    data: {
      method: data.method,
      endpoint: data.endpoint,
      statusCode: data.statusCode,
      duration: data.duration,
      cacheHit: data.cacheHit,
      retryCount: data.retryCount,
      errorType: data.errorType
    }
  })
}
