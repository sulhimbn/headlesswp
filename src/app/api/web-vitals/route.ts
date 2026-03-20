import { NextResponse } from 'next/server'
import { performanceMetricsCollector } from '@/lib/api/performanceMetrics'

interface WebVitalsResponse {
  events: Array<{
    name: string
    value: number
    rating: string
    id: string
    navigationType?: string
    timestamp?: string
  }>
  byMetricName: Record<string, {
    count: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  }>
  summary: {
    totalEvents: number
    uniqueMetrics: number
    timestamp: string
  }
  thresholds: Record<string, {
    good: number
    needsImprovement: number
    poor: number
  }>
}

const METRIC_THRESHOLDS: Record<string, { good: number; needsImprovement: number; poor: number }> = {
  LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
  FID: { good: 100, needsImprovement: 300, poor: 300 },
  INP: { good: 200, needsImprovement: 500, poor: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  TTFB: { good: 800, needsImprovement: 1800, poor: 1800 },
  FCP: { good: 1800, needsImprovement: 3000, poor: 3000 },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const webVitalsMetrics = performanceMetricsCollector.getWebVitalsMetrics()

    const now = Date.now()
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }
    const cutoff = now - (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h'])

    let filteredEvents = webVitalsMetrics.events.filter(event => {
      const idParts = event.id.split('-')
      const eventTime = idParts.length > 0 ? parseInt(idParts[0], 10) : now
      return isNaN(eventTime) ? true : eventTime > cutoff
    })

    if (limit > 0) {
      filteredEvents = filteredEvents.slice(-limit)
    }

    const byMetricName: Record<string, { count: number; avg: number; min: number; max: number; p50: number; p95: number; p99: number }> = {}
    const metricGroups: Record<string, number[]> = {}

    for (const event of filteredEvents) {
      if (!metricGroups[event.name]) {
        metricGroups[event.name] = []
      }
      metricGroups[event.name].push(event.value)
    }

    for (const [name, values] of Object.entries(metricGroups)) {
      const sorted = [...values].sort((a, b) => a - b)
      const n = sorted.length
      byMetricName[name] = {
        count: n,
        avg: sorted.reduce((sum, v) => sum + v, 0) / n,
        min: sorted[0],
        max: sorted[n - 1],
        p50: sorted[Math.floor(n * 0.5)],
        p95: sorted[Math.floor(n * 0.95)],
        p99: sorted[Math.floor(n * 0.99)]
      }
    }

    const response: WebVitalsResponse = {
      events: filteredEvents.map(event => ({
        name: event.name,
        value: event.value,
        rating: event.rating,
        id: event.id,
        navigationType: event.navigationType
      })),
      byMetricName,
      summary: {
        totalEvents: filteredEvents.length,
        uniqueMetrics: Object.keys(byMetricName).length,
        timestamp: new Date().toISOString()
      },
      thresholds: METRIC_THRESHOLDS
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      events: [],
      byMetricName: {},
      summary: {
        totalEvents: 0,
        uniqueMetrics: 0,
        timestamp: new Date().toISOString()
      },
      thresholds: METRIC_THRESHOLDS
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
}
