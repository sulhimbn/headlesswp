import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_HOST_NAME } from '@opentelemetry/semantic-conventions'
import { trace, context, SpanStatusCode, type Span, type SpanKind } from '@opentelemetry/api'
import { telemetryCollector } from '@/lib/api/telemetry'
import { logger } from '@/lib/utils/logger'

export interface OpenTelemetryConfig {
  enabled?: boolean
  serviceName?: string
  serviceVersion?: string
  otlpEndpoint?: string
  autoInstrumentations?: boolean
}

const defaultConfig: Required<OpenTelemetryConfig> = {
  enabled: process.env.OTEL_ENABLED !== 'false',
  serviceName: process.env.OTEL_SERVICE_NAME || 'headlesswp',
  serviceVersion: '1.0.0',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '',
  autoInstrumentations: true,
}

class OpenTelemetryProvider {
  private sdk: NodeSDK | null = null
  private config: Required<OpenTelemetryConfig>
  private initialized = false

  constructor() {
    this.config = { ...defaultConfig }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getTracer(name: string = 'headlesswp') {
    return trace.getTracer(name)
  }

  getActiveSpan(): Span | undefined {
    return trace.getActiveSpan()
  }

  getTraceId(): string | undefined {
    const span = this.getActiveSpan()
    if (span) {
      return span.spanContext().traceId
    }
    return undefined
  }

  getSpanId(): string | undefined {
    const span = this.getActiveSpan()
    if (span) {
      return span.spanContext().spanId
    }
    return undefined
  }

  init(): void {
    if (this.initialized) {
      return
    }

    if (!this.config.enabled) {
      logger.info('[OpenTelemetry] Disabled via OTEL_ENABLED=false, using no-op provider')
      this.initialized = true
      return
    }

    const resource = resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: this.config.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: this.config.serviceVersion,
      [SEMRESATTRS_HOST_NAME]: process.env.HOSTNAME || 'unknown',
    })

    const traceExporter = this.config.otlpEndpoint
      ? new OTLPTraceExporter({
          url: `${this.config.otlpEndpoint}/v1/traces`,
        })
      : undefined

    const instrumentations = this.config.autoInstrumentations
      ? getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        })
      : []

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations,
    })

    try {
      this.sdk.start()
      logger.info(`[OpenTelemetry] Initialized with service: ${this.config.serviceName}`)
      if (this.config.otlpEndpoint) {
        logger.info(`[OpenTelemetry] Exporting to: ${this.config.otlpEndpoint}`)
      } else {
        logger.info('[OpenTelemetry] No OTLP endpoint configured, traces will be logged only')
      }
    } catch (error) {
      logger.error('[OpenTelemetry] Failed to initialize:', error as Error)
    }

    this.initialized = true
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown()
      logger.info('[OpenTelemetry] Shutdown complete')
    }
  }

  recordTelemetryEvent(event: {
    type: string
    category: string
    data: Record<string, unknown>
  }): void {
    const span = this.getActiveSpan()
    if (span) {
      span.addEvent(event.type, {
        category: event.category,
        ...event.data,
      })
    }

    telemetryCollector.record({
      type: event.type,
      category: event.category as 'circuit-breaker' | 'retry' | 'rate-limit' | 'health-check' | 'api-request' | 'performance',
      data: event.data,
    })
  }

  createSpanContext(): { traceId?: string; spanId?: string } {
    const span = this.getActiveSpan()
    if (span) {
      return {
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
      }
    }
    return {}
  }
}

export const otelProvider = new OpenTelemetryProvider()

export function initOpenTelemetry(): void {
  otelProvider.init()
}

export function getTracer(name?: string) {
  return otelProvider.getTracer(name)
}

export function getCurrentTraceId(): string | undefined {
  return otelProvider.getTraceId()
}

export function getCurrentSpanId(): string | undefined {
  return otelProvider.getSpanId()
}

export async function shutdownOpenTelemetry(): Promise<void> {
  await otelProvider.shutdown()
}

export { trace, context, SpanStatusCode }
export type { SpanKind } from '@opentelemetry/api'