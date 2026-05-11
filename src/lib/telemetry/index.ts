import { initOpenTelemetry, shutdownOpenTelemetry } from './otel'
import { logger } from '@/lib/utils/logger'

initOpenTelemetry()

if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    logger.info('[OpenTelemetry] Received SIGTERM, shutting down...')
    await shutdownOpenTelemetry()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    logger.info('[OpenTelemetry] Received SIGINT, shutting down...')
    await shutdownOpenTelemetry()
    process.exit(0)
  })
}

export { initOpenTelemetry, shutdownOpenTelemetry }
export { getTracer, getCurrentTraceId, getCurrentSpanId, otelProvider } from './otel'
export {
  tracingService,
  traceWordPressAPI,
  traceCacheOperation,
  traceCircuitBreaker,
  traceRetry,
  traceRateLimit,
  tracePageRendering,
  getTraceContextHeaders,
  getTraceId,
} from './tracing'