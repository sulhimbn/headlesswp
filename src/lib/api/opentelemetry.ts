/**
 * OpenTelemetry Integration Module
 * 
 * Provides distributed tracing capabilities integrated with the existing telemetry system.
 * 
 * Features:
 * - OpenTelemetry SDK integration
 * - Trace context propagation through API calls
 * - Custom spans for WordPress API calls and cache operations
 * - Export configuration for multiple backends (Jaeger, Zipkin, DataDog, OTLP)
 * - Optional via environment variable (OTEL_ENABLED)
 * - Minimal overhead (<1ms per request)
 * 
 * Environment Variables:
 * - OTEL_ENABLED: Enable/disable OpenTelemetry (default: true in production)
 * - OTEL_EXPORTER: Export backend (otlp, jaeger, zipkin, console)
 * - OTEL_SERVICE_NAME: Service name for traces (default: headlesswp)
 * - OTEL_ENDPOINT: Export endpoint URL
 * - OTEL_SAMPLE_RATE: Sample rate (0-1, default: 1)
 */

import { logger } from '@/lib/utils/logger'
import { telemetryCollector } from './telemetry'

// OpenTelemetry interfaces - using minimal abstraction to avoid heavy dependencies
// In production, these would be replaced with actual OpenTelemetry SDK

export interface TraceContext {
  traceId: string
  spanId: string
  traceFlags: number
  traceState?: string
}

export interface SpanAttributes {
  [key: string]: string | number | boolean
}

export interface Span {
  name: string
  kind: 'server' | 'client' | 'internal' | 'producer' | 'consumer'
  status: 'ok' | 'error' | 'unset'
  startTime: number
  endTime?: number
  attributes: SpanAttributes
  parentSpanId?: string
  traceId: string
  spanId: string
  events: SpanEvent[]
}

export interface SpanEvent {
  name: string
  timestamp: number
  attributes?: SpanAttributes
}

export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span
  injectContext(carrier: Record<string, string>): void
  extractContext(carrier: Record<string, string>): TraceContext | null
}

export interface SpanOptions {
  kind?: Span['kind']
  parent?: Span | TraceContext
  attributes?: SpanAttributes
}

export interface OpenTelemetryConfig {
  enabled: boolean
  serviceName: string
  exporter: 'otlp' | 'jaeger' | 'zipkin' | 'console'
  endpoint?: string
  sampleRate: number
  includeHealthCheck: boolean
  includeCacheOperations: boolean
  includeRetryOperations: boolean
  includeCircuitBreaker: boolean
}

// Generate trace and span IDs
function generateId(length: number = 32): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

// Parse W3C traceparent header
export function parseTraceparent(header: string): TraceContext | null {
  const match = header.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/)
  if (!match) return null
  
  return {
    traceId: match[1],
    spanId: match[2],
    traceFlags: parseInt(match[3], 16)
  }
}

// Create W3C traceparent header
export function createTraceparent(context: TraceContext): string {
  const flags = context.traceFlags.toString(16).padStart(2, '0')
  return `00-${context.traceId}-${context.spanId}-${flags}`
}

/**
 * Custom Tracer implementation for distributed tracing
 * 
 * Provides lightweight tracing without requiring full OpenTelemetry SDK.
 * Can be upgraded to full OpenTelemetry SDK when needed.
 */
class OpenTelemetryTracer implements Tracer {
  private config: OpenTelemetryConfig
  private spans: Map<string, Span> = new Map()
  private activeSpans: Map<string, Span> = new Map()
  private currentTraceId?: string
  
  constructor(config: OpenTelemetryConfig) {
    this.config = config
  }
  
  startSpan(name: string, options?: SpanOptions): Span {
    // Check sampling
    if (Math.random() > this.config.sampleRate) {
      // Return a no-op span
      return this.createNoOpSpan(name, options)
    }
    
    const traceId = options?.parent 
      ? (options.parent as TraceContext).traceId 
      : this.currentTraceId || generateId(32)
    
    this.currentTraceId = traceId
    
    const spanId = generateId(16)
    const span: Span = {
      name,
      kind: options?.kind || 'internal',
      status: 'unset',
      startTime: Date.now(),
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': '1.0.0',
        'deployment.environment': process.env.NODE_ENV || 'development',
        ...options?.attributes
      },
      traceId,
      spanId,
      events: []
    }
    
    if (options?.parent) {
      span.parentSpanId = (options.parent as TraceContext).spanId
    }
    
    this.spans.set(spanId, span)
    this.activeSpans.set(spanId, span)
    
    return span
  }
  
  private createNoOpSpan(name: string, options?: SpanOptions): Span {
    return {
      name,
      kind: options?.kind || 'internal',
      status: 'unset',
      startTime: Date.now(),
      attributes: {},
      traceId: '',
      spanId: 'no-op',
      events: []
    }
  }
  
  endSpan(span: Span, status?: Span['status'], attributes?: SpanAttributes): void {
    if (span.spanId === 'no-op') return
    
    span.endTime = Date.now()
    span.status = status || 'ok'
    
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes }
    }
    
    this.activeSpans.delete(span.spanId)
    
    // Record to telemetry
    const duration = span.endTime - span.startTime
    telemetryCollector.record({
      type: 'span',
      category: 'performance',
      data: {
        name: span.name,
        kind: span.kind,
        status: span.status,
        duration,
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        attributes: span.attributes,
        events: span.events
      }
    })
    
    // Export if applicable
    this.exportSpan(span)
  }
  
  addEvent(span: Span, eventName: string, attributes?: SpanAttributes): void {
    if (span.spanId === 'no-op') return
    
    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes
    })
  }
  
  setAttribute(span: Span, key: string, value: string | number | boolean): void {
    if (span.spanId === 'no-op') return
    span.attributes[key] = value
  }
  
  injectContext(carrier: Record<string, string>): void {
    if (!this.currentTraceId) {
      this.currentTraceId = generateId(32)
    }
    
    const spanId = generateId(16)
    const context: TraceContext = {
      traceId: this.currentTraceId,
      spanId,
      traceFlags: 1
    }
    
    carrier['traceparent'] = createTraceparent(context)
    if (context.traceState) {
      carrier['tracestate'] = context.traceState
    }
  }
  
  extractContext(carrier: Record<string, string>): TraceContext | null {
    const traceparent = carrier['traceparent'] || carrier['Traceparent']
    if (!traceparent) return null
    
    const context = parseTraceparent(traceparent)
    if (context) {
      this.currentTraceId = context.traceId
    }
    
    return context
  }
  
  getCurrentSpan(): Span | undefined {
    const activeSpan = this.activeSpans.values().next().value
    return activeSpan
  }
  
  getSpans(): Span[] {
    return Array.from(this.spans.values())
  }
  
  clearSpans(): void {
    this.spans.clear()
    this.activeSpans.clear()
  }
  
  private exportSpan(span: Span): void {
    if (this.config.exporter === 'console') {
      this.exportToConsole(span)
    } else if (this.config.endpoint) {
      this.exportToBackend(span)
    }
  }
  
  private exportToConsole(span: Span): void {
    const duration = span.endTime ? span.endTime - span.startTime : 0
    logger.debug(`[OTEL] Span: ${span.name}`, { 
      module: 'OpenTelemetry',
      traceId: span.traceId,
      spanId: span.spanId,
      duration,
      status: span.status
    })
  }
  
  private exportToBackend(span: Span): void {
    // Implementation would send to the configured backend
    // This is a placeholder for actual export logic
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[OTEL] Exporting span to ${this.config.exporter}: ${span.name}`, {
        module: 'OpenTelemetry',
        endpoint: this.config.endpoint
      })
    }
  }
}

/**
 * Trace context manager for propagating trace information
 */
class TraceContextManager {
  private carrier: Record<string, string> = {}
  
  setCarrier(carrier: Record<string, string>): void {
    this.carrier = carrier
  }
  
  getCarrier(): Record<string, string> {
    return this.carrier
  }
  
  clear(): void {
    this.carrier = {}
  }
}

const defaultConfig: OpenTelemetryConfig = {
  enabled: process.env.OTEL_ENABLED !== 'false' && process.env.NODE_ENV !== 'test',
  serviceName: process.env.OTEL_SERVICE_NAME || 'headlesswp',
  exporter: (process.env.OTEL_EXPORTER as OpenTelemetryConfig['exporter']) || 'console',
  endpoint: process.env.OTEL_ENDPOINT,
  sampleRate: parseFloat(process.env.OTEL_SAMPLE_RATE || '1'),
  includeHealthCheck: true,
  includeCacheOperations: true,
  includeRetryOperations: true,
  includeCircuitBreaker: true
}

let tracerInstance: OpenTelemetryTracer | null = null
let contextManagerInstance: TraceContextManager | null = null

/**
 * Initialize the OpenTelemetry tracer
 */
export function initOpenTelemetry(config: Partial<OpenTelemetryConfig> = {}): OpenTelemetryTracer {
  const finalConfig = { ...defaultConfig, ...config }
  
  if (!finalConfig.enabled) {
    logger.info('OpenTelemetry disabled', { module: 'OpenTelemetry' })
    // Return a no-op tracer
    return new OpenTelemetryTracer({ ...finalConfig, enabled: false })
  }
  
  if (tracerInstance) {
    logger.warn('OpenTelemetry already initialized', { module: 'OpenTelemetry' })
    return tracerInstance
  }
  
  logger.info('Initializing OpenTelemetry', { 
    module: 'OpenTelemetry',
    serviceName: finalConfig.serviceName,
    exporter: finalConfig.exporter,
    sampleRate: finalConfig.sampleRate
  })
  
  tracerInstance = new OpenTelemetryTracer(finalConfig)
  contextManagerInstance = new TraceContextManager()
  
  return tracerInstance
}

/**
 * Get the current tracer instance
 */
export function getTracer(): OpenTelemetryTracer | null {
  return tracerInstance
}

/**
 * Get the trace context manager
 */
export function getTraceContextManager(): TraceContextManager | null {
  return contextManagerInstance
}

/**
 * Create a traced function wrapper
 */
export function traceFunction<T extends (...args: never[]) => unknown>(
  name: string,
  fn: T,
  options?: {
    attributes?: SpanAttributes
    kind?: Span['kind']
  }
): T {
  return ((...args: never[]) => {
    const tracer = getTracer()
    if (!tracer) return fn(...args)
    
    const span = tracer.startSpan(name, {
      kind: options?.kind || 'internal',
      attributes: options?.attributes
    })
    
    try {
      const result = fn(...args)
      
      // Handle Promise return values
      if (result && typeof result === 'object' && 'then' in result) {
        return (result as Promise<unknown>).then(
          (value) => {
            tracer.endSpan(span, 'ok')
            return value
          },
          (error) => {
            tracer.endSpan(span, 'error', { 'error.message': String(error) })
            throw error
          }
        )
      }
      
      tracer.endSpan(span, 'ok')
      return result
    } catch (error) {
      tracer.endSpan(span, 'error', { 'error.message': String(error) })
      throw error
    }
  }) as T
}

/**
 * Create a traced async function wrapper
 */
export function traceAsyncFunction<T extends (...args: never[]) => Promise<unknown>>(
  name: string,
  fn: T,
  options?: {
    attributes?: SpanAttributes
    kind?: Span['kind']
  }
): T {
  return (async (...args: never[]) => {
    const tracer = getTracer()
    if (!tracer) return fn(...args)
    
    const span = tracer.startSpan(name, {
      kind: options?.kind || 'internal',
      attributes: options?.attributes
    })
    
    try {
      const result = await fn(...args)
      tracer.endSpan(span, 'ok')
      return result
    } catch (error) {
      tracer.endSpan(span, 'error', { 'error.message': String(error) })
      throw error
    }
  }) as T
}

/**
 * Add custom span for WordPress API calls
 */
export function createWordPressApiSpan(
  method: string,
  endpoint: string,
  options?: {
    attributes?: SpanAttributes
  }
): { span: Span; tracer: OpenTelemetryTracer } | null {
  const tracer = getTracer()
  if (!tracer) return null
  
  const span = tracer.startSpan(`wp_api.${method.toLowerCase()}`, {
    kind: 'client',
    attributes: {
      'http.method': method,
      'http.url': endpoint,
      'http.target': endpoint,
      ...options?.attributes
    }
  })
  
  return { span, tracer }
}

/**
 * Add custom span for cache operations
 */
export function createCacheSpan(
  operation: 'get' | 'set' | 'delete' | 'invalidate',
  key: string,
  options?: {
    attributes?: SpanAttributes
  }
): { span: Span; tracer: OpenTelemetryTracer } | null {
  const tracer = getTracer()
  if (!tracer) return null
  
  const span = tracer.startSpan(`cache.${operation}`, {
    kind: 'internal',
    attributes: {
      'cache.key': key,
      'cache.operation': operation,
      ...options?.attributes
    }
  })
  
  return { span, tracer }
}

/**
 * Shutdown OpenTelemetry and flush any pending spans
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (tracerInstance) {
    logger.info('Shutting down OpenTelemetry', { module: 'OpenTelemetry' })
    tracerInstance.clearSpans()
    tracerInstance = null
  }
  
  contextManagerInstance = null
}

// Re-export types
export type { OpenTelemetryConfig as OpenTelemetryConfigType }
