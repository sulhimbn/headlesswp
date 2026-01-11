import { NextResponse } from 'next/server'
import { telemetryCollector } from '@/lib/api/telemetry'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'
import { TELEMETRY } from '@/lib/constants/appConstants'

async function metricsHandler() {
  try {
    const allEvents = telemetryCollector.getEvents()
    const stats = telemetryCollector.getStats()

    const circuitBreakerEvents = telemetryCollector.getEventsByCategory('circuit-breaker')
    const retryEvents = telemetryCollector.getEventsByCategory('retry')
    const rateLimitEvents = telemetryCollector.getEventsByCategory('rate-limit')
    const healthCheckEvents = telemetryCollector.getEventsByCategory('health-check')
    const apiRequestEvents = telemetryCollector.getEventsByCategory('api-request')

    const circuitBreakerStats = {
      stateChanges: telemetryCollector.getEventsByType('state-change').length,
      failures: telemetryCollector.getEventsByType('failure').length,
      successes: telemetryCollector.getEventsByType('success').length,
      requestsBlocked: telemetryCollector.getEventsByType('request-blocked').length,
      totalEvents: circuitBreakerEvents.length,
      recentEvents: circuitBreakerEvents.slice(-TELEMETRY.RECENT_EVENT_COUNT)
    }

    const retryStats = {
      retries: telemetryCollector.getEventsByType('retry').length,
      retrySuccesses: telemetryCollector.getEventsByType('retry-success').length,
      retryExhausted: telemetryCollector.getEventsByType('retry-exhausted').length,
      totalEvents: retryEvents.length,
      recentEvents: retryEvents.slice(-TELEMETRY.RECENT_EVENT_COUNT)
    }

    const rateLimitStats = {
      exceeded: telemetryCollector.getEventsByType('exceeded').length,
      resets: telemetryCollector.getEventsByType('reset').length,
      totalEvents: rateLimitEvents.length,
      recentEvents: rateLimitEvents.slice(-TELEMETRY.RECENT_EVENT_COUNT)
    }

    const healthCheckStats = {
      healthy: telemetryCollector.getEventsByType('healthy').length,
      unhealthy: telemetryCollector.getEventsByType('unhealthy').length,
      totalEvents: healthCheckEvents.length,
      recentEvents: healthCheckEvents.slice(-TELEMETRY.RECENT_EVENT_COUNT)
    }

    const apiRequestStats = {
      totalRequests: apiRequestEvents.length,
      successful: apiRequestEvents.filter((e) => {
        const statusCode = (e.data as { statusCode?: number }).statusCode
        return statusCode !== undefined && statusCode >= 200 && statusCode < 300
      }).length,
      failed: apiRequestEvents.filter((e) => {
        const statusCode = (e.data as { statusCode?: number }).statusCode
        return statusCode !== undefined && statusCode >= 400
      }).length,
      averageDuration: apiRequestEvents.length > 0
        ? Math.round(
            apiRequestEvents.reduce((sum, e) => {
              return sum + ((e.data as { duration?: number }).duration || 0)
            }, 0) / apiRequestEvents.length
          )
        : 0,
      cacheHits: apiRequestEvents.filter((e) => (e.data as { cacheHit?: boolean }).cacheHit === true).length,
      cacheMisses: apiRequestEvents.filter((e) => (e.data as { cacheHit?: boolean }).cacheHit === false).length,
      totalEvents: apiRequestEvents.length,
      recentEvents: apiRequestEvents.slice(-TELEMETRY.RECENT_EVENT_COUNT)
    }

    return NextResponse.json({
      summary: {
        totalEvents: allEvents.length,
        eventTypes: Object.keys(stats).length,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      stats,
      circuitBreaker: circuitBreakerStats,
      retry: retryStats,
      rateLimit: rateLimitStats,
      healthCheck: healthCheckStats,
      apiRequest: apiRequestStats
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

export const GET = withApiRateLimit(metricsHandler, 'metrics')
