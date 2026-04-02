import { NextResponse } from 'next/server'
import { getContentChangeDetector } from '@/lib/services/contentChangeDetector'

async function contentChangeMetricsHandler() {
  try {
    const detector = getContentChangeDetector()
    
    if (!detector) {
      return NextResponse.json({
        error: 'Content change detector not initialized'
      }, {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      })
    }

    const metrics = detector.getMetrics()

    return NextResponse.json({
      enabled: true,
      ...metrics,
      timestamp: new Date().toISOString()
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

export const GET = contentChangeMetricsHandler