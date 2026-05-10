/**
 * Cache instrumentation utilities for OpenTelemetry
 * 
 * Provides optional tracing for cache operations.
 * Only active when OTEL_ENABLED is set and not 'false'.
 */

import { getTracer, createCacheSpan } from '@/lib/api/opentelemetry'

/**
 * Instrumented cache operations wrapper
 * 
 * Adds OpenTelemetry spans to cache operations when enabled.
 */
export const cacheInstrumentation = {
  /**
   * Trace a cache get operation
   */
  traceGet<T>(key: string, getFn: () => T | null): T | null {
    const tracer = getTracer()
    const enabled = process.env.OTEL_ENABLED !== 'false' && process.env.NODE_ENV !== 'test'
    
    if (!enabled || !tracer) {
      return getFn()
    }
    
    const result = createCacheSpan('get', key)
    if (!result) {
      return getFn()
    }
    
    try {
      const value = getFn()
      const hit = value !== null
      tracer.setAttribute(result.span, 'cache.hit', hit)
      tracer.endSpan(result.span, 'ok')
      return value
    } catch (error) {
      tracer.endSpan(result.span, 'error', { 
        'error.message': String(error) 
      })
      throw error
    }
  },
  
  /**
   * Trace a cache set operation
   */
  traceSet<T>(
    key: string, 
    data: T, 
    ttl: number, 
    setFn: () => void,
    dependencies?: string[]
  ): void {
    const tracer = getTracer()
    const enabled = process.env.OTEL_ENABLED !== 'false' && process.env.NODE_ENV !== 'test'
    
    if (!enabled || !tracer) {
      setFn()
      return
    }
    
    const result = createCacheSpan('set', key, {
      attributes: {
        'cache.ttl': ttl,
        'cache.has_dependencies': !!dependencies
      }
    })
    if (!result) {
      setFn()
      return
    }
    
    try {
      setFn()
      tracer.endSpan(result.span, 'ok')
    } catch (error) {
      tracer.endSpan(result.span, 'error', { 
        'error.message': String(error) 
      })
      throw error
    }
  },
  
  /**
   * Trace a cache invalidate operation
   */
  traceInvalidate(
    key: string, 
    invalidateFn: () => void
  ): void {
    const tracer = getTracer()
    const enabled = process.env.OTEL_ENABLED !== 'false' && process.env.NODE_ENV !== 'test'
    
    if (!enabled || !tracer) {
      invalidateFn()
      return
    }
    
    const result = createCacheSpan('invalidate', key)
    if (!result) {
      invalidateFn()
      return
    }
    
    try {
      invalidateFn()
      tracer.endSpan(result.span, 'ok')
    } catch (error) {
      tracer.endSpan(result.span, 'error', { 
        'error.message': String(error) 
      })
      throw error
    }
  },
  
  /**
   * Trace a cache delete operation
   */
  traceDelete(
    key: string, 
    deleteFn: () => boolean
  ): boolean {
    const tracer = getTracer()
    const enabled = process.env.OTEL_ENABLED !== 'false' && process.env.NODE_ENV !== 'test'
    
    if (!enabled || !tracer) {
      return deleteFn()
    }
    
    const result = createCacheSpan('delete', key)
    if (!result) {
      return deleteFn()
    }
    
    try {
      const deleted = deleteFn()
      tracer.setAttribute(result.span, 'cache.deleted', deleted)
      tracer.endSpan(result.span, 'ok')
      return deleted
    } catch (error) {
      tracer.endSpan(result.span, 'error', { 
        'error.message': String(error) 
      })
      throw error
    }
  }
}
