import { NextResponse } from 'next/server'
import { webVitalsStore } from '@/lib/api/webVitalsStore'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function vitalsHandler() {
  try {
    const metrics = webVitalsStore.getAggregatedMetrics()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics,
      summary: {
        totalEvents: Object.values(metrics).reduce((sum, m) => sum + m.count, 0)
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
        'Content-Type': 'application/json'
      }
    })
  }
}

export const GET = withApiRateLimit(vitalsHandler, 'vitals')