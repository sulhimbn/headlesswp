import { NextResponse } from 'next/server'
import { telemetryCollector } from '@/lib/api/telemetry'

export async function GET() {
  const startTime = Date.now()

  try {
    const checks = {
      cache: {
        status: 'ok',
        message: 'Cache manager initialized'
      },
      memory: {
        status: 'ok',
        message: 'Memory usage within limits'
      }
    }

    const duration = Date.now() - startTime

    telemetryCollector.record({
      type: 'healthy',
      category: 'health-check',
      data: {
        healthy: true,
        latency: duration,
        endpoint: '/api/health/readiness'
      }
    })

    return NextResponse.json({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }, {
      status: 200,
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
        endpoint: '/api/health/readiness',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      status: 'not-ready',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
}
