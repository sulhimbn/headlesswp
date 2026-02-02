import { logger } from '@/lib/utils/logger'

export interface TelemetryEvent {
  timestamp: string
  type: string
  category: 'circuit-breaker' | 'retry' | 'rate-limit' | 'health-check' | 'api-request' | 'performance'
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

  private statsCache: Record<string, number> = {}

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

    const key = `${event.category}.${event.type}`
    this.statsCache[key] = (this.statsCache[key] || 0) + 1

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
    this.statsCache = {}
  }

  flush(): TelemetryEvent[] {
    const flushed = [...this.events]
    this.events = []
    this.statsCache = {}
    return flushed
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.clear()
  }

  getStats(): Record<string, number> {
    return { ...this.statsCache }
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

export interface RetryTelemetry {
  attempt: number
  maxRetries: number
  delay: number
  errorType: string
  endpoint?: string
}

export interface RateLimitTelemetry {
  limit: number
  remaining: number
  resetTime: number
  windowMs: number
  key?: string
}

export interface HealthCheckTelemetry {
  healthy: boolean
  latency: number
  endpoint?: string
  version?: string
  error?: string
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
