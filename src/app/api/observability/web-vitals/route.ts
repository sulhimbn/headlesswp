import { NextResponse } from 'next/server'
import { webVitalsStore, type WebVitalsReport } from '@/lib/api/webVitalsStore'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function webVitalsHandler(request: Request) {
  try {
    const body = await request.json()

    const metric: WebVitalsReport = {
      name: body.name,
      value: body.value,
      rating: body.rating,
      id: body.id,
      navigationType: body.navigationType
    }

    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({
        error: 'Invalid web vital data'
      }, {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    webVitalsStore.record(metric)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    }, {
      status: 201,
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

export const POST = withApiRateLimit(webVitalsHandler, 'web-vitals')