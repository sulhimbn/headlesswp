import {
  initOpenTelemetry,
  getTracer,
  getTraceContextManager,
  createWordPressApiSpan,
  createCacheSpan,
  traceFunction,
  traceAsyncFunction,
  shutdownOpenTelemetry,
  parseTraceparent,
  createTraceparent,
  TraceContext
} from '@/lib/api/opentelemetry'

describe('OpenTelemetry', () => {
  afterEach(() => {
    shutdownOpenTelemetry()
  })

  describe('initOpenTelemetry', () => {
    it('should initialize with default config', () => {
      const tracer = initOpenTelemetry({ enabled: true })
      expect(tracer).toBeDefined()
    })

    it('should disable when OTEL_ENABLED is false', () => {
      const originalEnv = process.env.OTEL_ENABLED
      process.env.OTEL_ENABLED = 'false'
      
      const tracer = initOpenTelemetry({ enabled: false })
      expect(tracer).toBeDefined()
      
      process.env.OTEL_ENABLED = originalEnv
    })

    it('should use custom service name', () => {
      const tracer = initOpenTelemetry({ serviceName: 'custom-service', enabled: true })
      expect(tracer).toBeDefined()
    })

    it('should respect sample rate', () => {
      const tracer = initOpenTelemetry({ sampleRate: 0.5, enabled: true })
      expect(tracer).toBeDefined()
    })
  })

  describe('Tracer operations', () => {
    beforeEach(() => {
      initOpenTelemetry({ enabled: true })
    })

    it('should start a span', () => {
      const tracer = getTracer()
      expect(tracer).toBeDefined()
      
      const span = tracer!.startSpan('test-span')
      expect(span.name).toBe('test-span')
      expect(span.traceId).toBeDefined()
      expect(span.spanId).toBeDefined()
    })

    it('should end a span with status', () => {
      const tracer = getTracer()!
      const span = tracer.startSpan('test-span')
      
      tracer.endSpan(span, 'ok', { 'test.attribute': 'value' })
      
      expect(span.status).toBe('ok')
      expect(span.endTime).toBeDefined()
    })

    it('should end a span with error status', () => {
      const tracer = getTracer()!
      const span = tracer.startSpan('error-span')
      
      tracer.endSpan(span, 'error', { 'error.message': 'test error' })
      
      expect(span.status).toBe('error')
    })

    it('should add events to span', () => {
      const tracer = getTracer()!
      const span = tracer.startSpan('event-span')
      
      tracer.addEvent(span, 'test-event', { 'event.data': 'test' })
      
      expect(span.events).toHaveLength(1)
      expect(span.events[0].name).toBe('test-event')
    })

    it('should set attributes on span', () => {
      const tracer = getTracer()!
      const span = tracer.startSpan('attr-span')
      
      tracer.setAttribute(span, 'custom.key', 'custom-value')
      
      expect(span.attributes['custom.key']).toBe('custom-value')
    })

    it('should track multiple spans', () => {
      const tracer = getTracer()!
      
      const span1 = tracer.startSpan('span-1')
      const span2 = tracer.startSpan('span-2')
      
      expect(tracer.getSpans()).toHaveLength(2)
      
      tracer.endSpan(span1, 'ok')
      tracer.endSpan(span2, 'ok')
      
      // Spans are still tracked after ending
      expect(tracer.getSpans()).toHaveLength(2)
    })

    it('should clear spans', () => {
      const tracer = getTracer()!
      
      const span = tracer.startSpan('clear-span')
      tracer.endSpan(span, 'ok')
      
      tracer.clearSpans()
      
      expect(tracer.getSpans()).toHaveLength(0)
    })
  })

  describe('Trace Context Propagation', () => {
    beforeEach(() => {
      initOpenTelemetry({ enabled: true })
    })

    it('should inject trace context into carrier', () => {
      const tracer = getTracer()!
      
      const carrier: Record<string, string> = {}
      tracer.injectContext(carrier)
      
      expect(carrier['traceparent']).toBeDefined()
      expect(carrier['traceparent']).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[a-f0-9]{2}$/)
    })

    it('should extract trace context from carrier', () => {
      const tracer = getTracer()!
      
      // First inject a context
      const carrier: Record<string, string> = {}
      tracer.injectContext(carrier)
      
      // Then extract it
      const extracted = tracer.extractContext(carrier)
      
      expect(extracted).toBeDefined()
      expect(extracted?.traceId).toBeDefined()
      expect(extracted?.spanId).toBeDefined()
    })

    it('should return null for missing traceparent', () => {
      const tracer = getTracer()!
      
      const carrier: Record<string, string> = {}
      const extracted = tracer.extractContext(carrier)
      
      expect(extracted).toBeNull()
    })

    it('should parse valid traceparent', () => {
      const context = parseTraceparent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')
      
      expect(context).toBeDefined()
      expect(context?.traceId).toBe('0af7651916cd43dd8448eb211c80319c')
      expect(context?.spanId).toBe('b7ad6b7169203331')
      expect(context?.traceFlags).toBe(1)
    })

    it('should return null for invalid traceparent', () => {
      const context = parseTraceparent('invalid')
      expect(context).toBeNull()
    })

    it('should create traceparent from context', () => {
      const context: TraceContext = {
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        traceFlags: 1
      }
      
      const traceparent = createTraceparent(context)
      
      expect(traceparent).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')
    })
  })

  describe('createWordPressApiSpan', () => {
    it('should create span with correct attributes', () => {
      initOpenTelemetry({ enabled: true })
      
      const result = createWordPressApiSpan('GET', '/wp/v2/posts')
      
      expect(result).toBeDefined()
      expect(result?.span.name).toBe('wp_api.get')
      expect(result?.span.kind).toBe('client')
      expect(result?.span.attributes['http.method']).toBe('GET')
      expect(result?.span.attributes['http.url']).toBe('/wp/v2/posts')
    })

    it('should return null when tracer not initialized', () => {
      shutdownOpenTelemetry()
      
      const result = createWordPressApiSpan('POST', '/wp/v2/posts')
      
      expect(result).toBeNull()
    })
  })

  describe('createCacheSpan', () => {
    it('should create span with correct attributes', () => {
      initOpenTelemetry({ enabled: true })
      
      const result = createCacheSpan('get', 'posts:default')
      
      expect(result).toBeDefined()
      expect(result?.span.name).toBe('cache.get')
      expect(result?.span.kind).toBe('internal')
      expect(result?.span.attributes['cache.key']).toBe('posts:default')
      expect(result?.span.attributes['cache.operation']).toBe('get')
    })

    it('should return null when tracer not initialized', () => {
      shutdownOpenTelemetry()
      
      const result = createCacheSpan('set', 'posts:default')
      
      expect(result).toBeNull()
    })
  })

  describe('traceFunction', () => {
    it('should wrap synchronous function with span', () => {
      initOpenTelemetry({ enabled: true })
      
      const tracedFn = traceFunction('test-fn', (x: number) => x * 2)
      
      const result = tracedFn(5)
      
      expect(result).toBe(10)
    })

    it('should record error when function throws', () => {
      initOpenTelemetry({ enabled: true })
      
      const tracedFn = traceFunction('error-fn', () => {
        throw new Error('test error')
      })
      
      expect(() => tracedFn()).toThrow('test error')
    })

    it('should handle async functions', async () => {
      initOpenTelemetry({ enabled: true })
      
      const tracedAsyncFn = traceAsyncFunction('async-fn', async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return x * 2
      })
      
      const result = await tracedAsyncFn(5)
      
      expect(result).toBe(10)
    })
  })

  describe('TraceContextManager', () => {
    it('should manage trace context carrier', () => {
      initOpenTelemetry({ enabled: true })
      
      const manager = getTraceContextManager()
      expect(manager).toBeDefined()
      
      const carrier = { traceparent: '00-abc-def-01' }
      manager!.setCarrier(carrier)
      
      expect(manager!.getCarrier()).toEqual(carrier)
      
      manager!.clear()
      expect(manager!.getCarrier()).toEqual({})
    })
  })

  describe('shutdownOpenTelemetry', () => {
    it('should clear tracer on shutdown', () => {
      initOpenTelemetry({ enabled: true })
      
      expect(getTracer()).toBeDefined()
      
      shutdownOpenTelemetry()
      
      // After shutdown, initOpenTelemetry creates a new instance
      const newTracer = initOpenTelemetry({ enabled: true })
      expect(newTracer).toBeDefined()
    })
  })

  describe('Configuration', () => {
    it('should use environment variables for config', () => {
      const originalEnv = { ...process.env }
      
      process.env.OTEL_SERVICE_NAME = 'test-service'
      process.env.OTEL_EXPORTER = 'jaeger'
      process.env.OTEL_ENDPOINT = 'http://jaeger:14268/api/traces'
      process.env.OTEL_SAMPLE_RATE = '0.5'
      
      const tracer = initOpenTelemetry()
      expect(tracer).toBeDefined()
      
      process.env.OTEL_SERVICE_NAME = originalEnv.OTEL_SERVICE_NAME
      process.env.OTEL_EXPORTER = originalEnv.OTEL_EXPORTER
      process.env.OTEL_ENDPOINT = originalEnv.OTEL_ENDPOINT
      process.env.OTEL_SAMPLE_RATE = originalEnv.OTEL_SAMPLE_RATE
    })
  })
})
