import { NextResponse } from 'next/server'
import { checkApiHealth } from '@/lib/api/client'
import { telemetryCollector } from '@/lib/api/telemetry'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function healthHandler() {
  const startTime = Date.now()

  try {
    const result = await checkApiHealth()
    const duration = Date.now() - startTime

    telemetryCollector.record({
      type: result.healthy ? 'healthy' : 'unhealthy',
      category: 'health-check',
      data: {
        healthy: result.healthy,
        latency: duration,
        endpoint: '/api/health',
        version: result.version,
        error: result.error
      }
    })

    if (result.healthy) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: result.timestamp,
        latency: result.latency,
        version: result.version,
        uptime: process.uptime()
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      })
    }

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: result.timestamp,
      message: result.message,
      error: result.error,
      latency: result.latency
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime

    telemetryCollector.record({
      type: 'unhealthy',
      category: 'health-check',
      data: {
        healthy: false,
        latency: duration,
        endpoint: '/api/health',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      status: 'error',
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

export const GET = withApiRateLimit(healthHandler, 'health')
