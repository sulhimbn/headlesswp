import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api'

const tracer = trace.getTracer('headlesswp', process.env.npm_package_version || '1.0.0')

export interface TraceOptions {
  name: string
  kind?: SpanKind
  attributes?: Record<string, string | number | boolean>
}

export function createTraceSpan<T>(
  options: TraceOptions,
  fn: (span: ReturnType<typeof tracer.startActiveSpan>) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(options.name, {
    kind: options.kind || SpanKind.INTERNAL,
    attributes: {
      'service.name': 'headlesswp',
      ...options.attributes
    }
  }, async (span) => {
    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error)
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

export function traceAsync<T>(
  name: string,
  attributes: Record<string, string | number | boolean> = {},
  fn: () => Promise<T>
): Promise<T> {
  return createTraceSpan({ name, attributes }, async () => {
    return fn()
  })
}

export function traceSync<T>(
  name: string,
  attributes: Record<string, string | number | boolean> = {},
  fn: () => T
): T {
  return tracer.startActiveSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'service.name': 'headlesswp',
      ...attributes
    }
  }, (span) => {
    try {
      const result = fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error)
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

export function addTraceAttribute(key: string, value: string | number | boolean): void {
  const span = trace.getActiveSpan()
  if (span) {
    span.setAttribute(key, value)
  }
}

export { tracer }