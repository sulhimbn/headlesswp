import { NextResponse } from 'next/server'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'
import { 
  performanceMetricsCollector, 
  captureCurrentResourceUtilization 
} from '@/lib/api/performanceMetrics'

async function performanceHandler() {
  try {
    const apiMetrics = performanceMetricsCollector.getApiResponseMetrics()
    const resourceMetrics = performanceMetricsCollector.getResourceMetrics()
    const errorMetrics = performanceMetricsCollector.getErrorMetrics()
    const webVitalsMetrics = performanceMetricsCollector.getWebVitalsMetrics()

    const currentResourceUtilization = captureCurrentResourceUtilization()

    return NextResponse.json({
      summary: {
        totalApiCalls: apiMetrics.total,
        totalErrorTypes: errorMetrics.length,
        totalWebVitalEvents: webVitalsMetrics.events.length,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      apiResponse: {
        total: apiMetrics.total,
        p50: Math.round(apiMetrics.p50),
        p95: Math.round(apiMetrics.p95),
        p99: Math.round(apiMetrics.p99),
        avg: Math.round(apiMetrics.avg),
        min: Math.round(apiMetrics.min),
        max: Math.round(apiMetrics.max),
        byEndpoint: apiMetrics.byEndpoint
      },
      resourceUtilization: {
        current: currentResourceUtilization,
        latest: resourceMetrics.latest,
        avgCpuUsage: Math.round(resourceMetrics.avgCpuUsage),
        avgMemoryUsage: Math.round(resourceMetrics.avgMemoryUsage),
        avgHeapUsage: Math.round(resourceMetrics.avgHeapUsage)
      },
      errorRates: errorMetrics.map(metric => ({
        endpoint: metric.endpoint,
        method: metric.method,
        errorType: metric.errorType,
        count: metric.count,
        totalRequests: metric.totalRequests,
        rate: Math.round(metric.rate * 1000) / 1000
      })),
      webVitals: {
        events: webVitalsMetrics.events.slice(-100),
        byMetricName: webVitalsMetrics.byMetricName
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
}

export const GET = withApiRateLimit(performanceHandler, 'performance')
