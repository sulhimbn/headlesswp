import { Span, SpanKind, SpanStatusCode, context, Tracer, trace } from '@opentelemetry/api'
import { otelProvider, getTracer } from './otel'
import { cacheManager } from '@/lib/cache'
import { CircuitState } from '@/lib/api/circuitBreaker'

export interface SpanOptions {
  name: string
  attributes?: Record<string, string | number | boolean>
  kind?: SpanKind
  startTime?: number
}

export interface WordPressAPISpanData {
  method: string
  endpoint: string
  statusCode?: number
  duration?: number
  cacheHit?: boolean
  retryCount?: number
  errorType?: string
}

export interface CacheSpanData {
  operation: 'get' | 'set' | 'delete' | 'invalidate' | 'clear'
  key: string
  cacheHit?: boolean
  ttl?: number
  dependencies?: string[]
}

export interface ResilienceSpanData {
  pattern: 'circuit-breaker' | 'retry' | 'rate-limit'
  operation: string
  state?: string
  success?: boolean
  duration?: number
  error?: string
}

export interface PageRenderingSpanData {
  route: string
  params?: Record<string, string>
  revalidate?: number
  cacheHit?: boolean
}

class TracingService {
  private tracer: Tracer

  constructor() {
    this.tracer = getTracer('headlesswp-tracing')
  }

  createSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: { attributes?: Record<string, string | number | boolean>; kind?: SpanKind }
  ): Promise<T> {
    const span = this.tracer.startSpan(name, {
      kind: options?.kind ?? SpanKind.INTERNAL,
      attributes: options?.attributes,
    })

    return context.with(
      trace.setSpan(context.active(), span),
      async () => {
        try {
          const result = await fn(span)
          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          })
          span.recordException(error as Error)
          throw error
        } finally {
          span.end()
        }
      }
    )
  }

  async traceWordPressAPI<T>(
    method: string,
    endpoint: string,
    fn: () => Promise<T>,
    options?: { retryCount?: number; cacheKey?: string }
  ): Promise<T> {
    const spanName = `WordPress.API.${method}`
    const startTime = Date.now()

    return this.createSpan(
      spanName,
      async (span) => {
        span.setAttributes({
          'http.method': method,
          'http.url': endpoint,
          'wp.api.method': method,
          'wp.api.endpoint': endpoint,
          'wp.api.operation': 'request',
        })

        if (options?.retryCount && options.retryCount > 0) {
          span.setAttribute('wp.api.retry_count', options.retryCount)
        }

        try {
          const result = await fn()

          const cacheKey = options?.cacheKey
          if (cacheKey) {
            const cached = cacheManager.get<unknown>(cacheKey)
            if (cached) {
              span.setAttribute('cache.hit', true)
            }
          }

          const duration = Date.now() - startTime
          span.setAttributes({
            'http.duration_ms': duration,
            'http.status_code': 200,
            'wp.api.success': true,
          })

          otelProvider.recordTelemetryEvent({
            type: 'api-request',
            category: 'api-request',
            data: {
              method,
              endpoint,
              statusCode: 200,
              duration,
              cacheHit: false,
              retryCount: options?.retryCount,
            },
          })

          return result
        } catch (error) {
          const duration = Date.now() - startTime
          const errorInfo = this.extractErrorInfo(error)

          span.setAttributes({
            'http.duration_ms': duration,
            'http.status_code': errorInfo.statusCode || 500,
            'wp.api.success': false,
            'error.type': errorInfo.type,
            'error.message': errorInfo.message,
          })

          otelProvider.recordTelemetryEvent({
            type: 'api-request',
            category: 'api-request',
            data: {
              method,
              endpoint,
              statusCode: errorInfo.statusCode || 500,
              duration,
              errorType: errorInfo.type,
              retryCount: options?.retryCount,
            },
          })

          throw error
        }
      },
      {
        attributes: {
          'tracing.service': 'wordpress-api',
          'tracing.operation': 'api-request',
        },
      }
    )
  }

  async traceCacheOperation<T>(
    operation: 'get' | 'set' | 'delete' | 'invalidate' | 'clear',
    key: string,
    fn: () => T,
    options?: { ttl?: number; dependencies?: string[] }
  ): Promise<T> {
    const spanName = `Cache.${operation.charAt(0).toUpperCase() + operation.slice(1)}`

    return this.createSpan(
      spanName,
      async (span) => {
        span.setAttributes({
          'cache.operation': operation,
          'cache.key': key,
          'cache.service': 'CacheManager',
        })

        if (options?.ttl) {
          span.setAttribute('cache.ttl_ms', options.ttl)
        }

        if (options?.dependencies && options.dependencies.length > 0) {
          span.setAttribute('cache.dependencies_count', options.dependencies.length)
        }

        const startTime = Date.now()
        try {
          const result = fn()
          const duration = Date.now() - startTime

          span.setAttributes({
            'cache.duration_ms': duration,
            'cache.success': true,
          })

          if (operation === 'get') {
            span.setAttribute('cache.hit', result !== null)
          }

          return result
        } catch (error) {
          span.setAttributes({
            'cache.success': false,
            'error.type': error instanceof Error ? error.name : 'UnknownError',
          })
          throw error
        }
      },
      {
        attributes: {
          'tracing.service': 'cache',
          'tracing.operation': operation,
        },
      }
    )
  }

  async traceCircuitBreaker<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: {
      endpoint?: string
      state?: CircuitState
      onStateChange?: (state: CircuitState) => void
    }
  ): Promise<T> {
    const spanName = `Resilience.CircuitBreaker.${operation}`

    return this.createSpan(
      spanName,
      async (span) => {
        span.setAttributes({
          'resilience.pattern': 'circuit-breaker',
          'resilience.operation': operation,
          'resilience.service': 'CircuitBreaker',
        })

        if (options?.endpoint) {
          span.setAttribute('resilience.endpoint', options.endpoint)
        }

        if (options?.state) {
          span.setAttribute('resilience.circuit_state', options.state)
        }

        const startTime = Date.now()
        try {
          const result = await fn()
          const duration = Date.now() - startTime

          span.setAttributes({
            'resilience.success': true,
            'resilience.duration_ms': duration,
          })

          otelProvider.recordTelemetryEvent({
            type: 'success',
            category: 'circuit-breaker',
            data: {
              operation,
              state: options?.state || CircuitState.CLOSED,
              duration,
              endpoint: options?.endpoint,
            },
          })

          return result
        } catch (error) {
          const duration = Date.now() - startTime

          span.setAttributes({
            'resilience.success': false,
            'resilience.duration_ms': duration,
            'error.message': error instanceof Error ? error.message : String(error),
          })

          otelProvider.recordTelemetryEvent({
            type: 'failure',
            category: 'circuit-breaker',
            data: {
              operation,
              state: CircuitState.OPEN,
              duration,
              error: error instanceof Error ? error.message : String(error),
              endpoint: options?.endpoint,
            },
          })

          throw error
        }
      },
      {
        attributes: {
          'tracing.service': 'resilience',
          'tracing.pattern': 'circuit-breaker',
        },
      }
    )
  }

  async traceRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: {
      maxRetries?: number
      currentRetry?: number
    }
  ): Promise<T> {
    const spanName = `Resilience.Retry.${operation}`

    return this.createSpan(
      spanName,
      async (span) => {
        span.setAttributes({
          'resilience.pattern': 'retry',
          'resilience.operation': operation,
          'resilience.service': 'RetryStrategy',
        })

        if (options?.maxRetries !== undefined) {
          span.setAttribute('resilience.max_retries', options.maxRetries)
        }

        if (options?.currentRetry !== undefined) {
          span.setAttribute('resilience.current_retry', options.currentRetry)
        }

        try {
          const result = await fn()
          span.setAttribute('resilience.success', true)

          if (options?.currentRetry && options.currentRetry > 0) {
            otelProvider.recordTelemetryEvent({
              type: 'retry-success',
              category: 'retry',
              data: {
                operation,
                retryCount: options.currentRetry,
              },
            })
          }

          return result
        } catch (error) {
          span.setAttribute('resilience.success', false)
          span.setAttribute('error.message', error instanceof Error ? error.message : String(error))

          if (options?.currentRetry !== undefined) {
            otelProvider.recordTelemetryEvent({
              type: 'retry-failure',
              category: 'retry',
              data: {
                operation,
                retryCount: options.currentRetry,
                error: error instanceof Error ? error.message : String(error),
              },
            })
          }

          throw error
        }
      },
      {
        attributes: {
          'tracing.service': 'resilience',
          'tracing.pattern': 'retry',
        },
      }
    )
  }

  async traceRateLimit<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const spanName = `Resilience.RateLimit.${operation}`

    return this.createSpan(
      spanName,
      async (span) => {
        span.setAttributes({
          'resilience.pattern': 'rate-limit',
          'resilience.operation': operation,
          'resilience.service': 'RateLimiter',
        })

        try {
          const result = await fn()
          span.setAttribute('resilience.success', true)
          return result
        } catch (error) {
          const errorInfo = this.extractErrorInfo(error)

          if (errorInfo.type === 'RATE_LIMIT_ERROR') {
            span.setAttribute('resilience.rate_limited', true)
            span.setAttribute('resilience.success', false)

            otelProvider.recordTelemetryEvent({
              type: 'rate-limit-exceeded',
              category: 'rate-limit',
              data: {
                operation,
                error: errorInfo.message,
              },
            })
          }

          throw error
        }
      },
      {
        attributes: {
          'tracing.service': 'resilience',
          'tracing.pattern': 'rate-limit',
        },
      }
    )
  }

  async tracePageRendering<T>(
    route: string,
    fn: () => Promise<T>,
    options?: {
      params?: Record<string, string>
      revalidate?: number
    }
  ): Promise<T> {
    const spanName = `Page.Rendering.${route}`

    return this.createSpan(
      spanName,
      async (span) => {
        span.setAttributes({
          'page.route': route,
          'page.type': 'ssr' as const,
          'page.service': 'Next.js',
        })

        if (options?.params) {
          Object.entries(options.params).forEach(([key, value]) => {
            span.setAttribute(`page.params.${key}`, value)
          })
        }

        if (options?.revalidate) {
          span.setAttribute('page.revalidate_seconds', options.revalidate)
        }

        const startTime = Date.now()
        try {
          const result = await fn()
          const duration = Date.now() - startTime

          span.setAttributes({
            'page.render_duration_ms': duration,
            'page.render_success': true,
          })

          return result
        } catch (error) {
          const duration = Date.now() - startTime

          span.setAttributes({
            'page.render_duration_ms': duration,
            'page.render_success': false,
            'error.message': error instanceof Error ? error.message : String(error),
          })

          throw error
        }
      },
      {
        attributes: {
          'tracing.service': 'page-rendering',
          'tracing.operation': 'render',
        },
      }
    )
  }

  private extractErrorInfo(error: unknown): { type: string; message: string; statusCode?: number } {
    if (error && typeof error === 'object') {
      if ('type' in error) {
        return {
          type: String((error as { type: unknown }).type),
          message: 'message' in error ? String((error as { message: unknown }).message) : String(error),
          statusCode: 'statusCode' in error ? Number((error as { statusCode: unknown }).statusCode) : undefined,
        }
      }
      if ('response' in error) {
        const response = (error as { response?: { status?: number; data?: { message?: string } } }).response
        return {
          type: 'HTTP_ERROR',
          message: response?.data?.message || 'HTTP request failed',
          statusCode: response?.status,
        }
      }
    }

    return {
      type: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    }
  }

  getTraceContext(): { traceId?: string; spanId?: string; traceFlags?: number } {
    const span = otelProvider.getActiveSpan()
    if (span) {
      return {
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        traceFlags: span.spanContext().traceFlags,
      }
    }
    return {}
  }

  createTraceContextHeaders(): Record<string, string> {
    const context = this.getTraceContext()
    const headers: Record<string, string> = {}

    if (context.traceId) {
      headers['x-trace-id'] = context.traceId
    }
    if (context.spanId) {
      headers['x-span-id'] = context.spanId
    }

    return headers
  }
}

export const tracingService = new TracingService()

export function traceWordPressAPI<T>(
  method: string,
  endpoint: string,
  fn: () => Promise<T>,
  options?: { retryCount?: number; cacheKey?: string }
): Promise<T> {
  return tracingService.traceWordPressAPI(method, endpoint, fn, options)
}

export function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete' | 'invalidate' | 'clear',
  key: string,
  fn: () => T,
  options?: { ttl?: number; dependencies?: string[] }
): T {
  return tracingService.traceCacheOperation(operation, key, fn, options) as T
}

export function traceCircuitBreaker<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    endpoint?: string
    state?: CircuitState
  }
): Promise<T> {
  return tracingService.traceCircuitBreaker(operation, fn, options)
}

export function traceRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: { maxRetries?: number; currentRetry?: number }
): Promise<T> {
  return tracingService.traceRetry(operation, fn, options)
}

export function traceRateLimit<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracingService.traceRateLimit(operation, fn)
}

export function tracePageRendering<T>(
  route: string,
  fn: () => Promise<T>,
  options?: {
    params?: Record<string, string>
    revalidate?: number
  }
): Promise<T> {
  return tracingService.tracePageRendering(route, fn, options)
}

export function getTraceContextHeaders(): Record<string, string> {
  return tracingService.createTraceContextHeaders()
}

export function getTraceId(): string | undefined {
  return otelProvider.getTraceId()
}