import { NodeSDK } from '@opentelemetry/sdk-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { logger } from '@/lib/utils/logger'

const serviceName = process.env.OTEL_SERVICE_NAME || 'headlesswp'
const enabled = process.env.OTEL_ENABLED !== 'false'

const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
})

let sdk: NodeSDK | null = null

if (enabled && process.env.NODE_ENV !== 'test') {
  try {
    const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base')

    const exporters = []

    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
      exporters.push(
        new OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : undefined
        })
      )
    } else if (process.env.OTEL_CONSOLE_EXPORT === 'true') {
      exporters.push(new ConsoleSpanExporter())
    }

    if (exporters.length === 0) {
      exporters.push(new ConsoleSpanExporter())
    }

    sdk = new NodeSDK({
      resource,
      traceExporter: exporters[0],
      instrumentations: [
        new HttpInstrumentation({
          enabled: true
        })
      ]
    })

    sdk.start()
    logger.info('OpenTelemetry tracing initialized', { module: 'Tracing' })
  } catch (error) {
    logger.warn('Failed to start OpenTelemetry SDK', error as Error, { module: 'Tracing' })
  }
}

process.on('SIGTERM', () => {
  if (sdk) {
    sdk.shutdown().catch((error: Error) => {
      logger.warn('Error shutting down OpenTelemetry SDK', error, { module: 'Tracing' })
    })
  }
})

export { sdk }