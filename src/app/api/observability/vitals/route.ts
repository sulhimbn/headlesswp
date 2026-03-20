import { NextRequest, NextResponse } from 'next/server'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'TTFB' | 'CLS' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
  timestamp?: string
  url?: string
  userAgent?: string
}

interface AlertThresholds {
  lcp: { good: number; poor: number }
  fid: { good: number; poor: number }
  cls: { good: number; poor: number }
  inp: { good: number; poor: number }
  fcp: { good: number; poor: number }
  ttfb: { good: number; poor: number }
}

const ALERT_THRESHOLDS: AlertThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
}

const webVitalsStore: Map<string, WebVitalsMetric[]> = new Map()

function checkAlertThresholds(metric: WebVitalsMetric): string[] {
  const alerts: string[] = []
  const threshold = ALERT_THRESHOLDS[metric.name.toLowerCase() as keyof AlertThresholds]
  
  if (!threshold) return alerts
  
  if (metric.value > threshold.poor) {
    alerts.push(`CRITICAL: ${metric.name} is ${metric.value}ms (poor threshold: ${threshold.poor}ms)`)
  } else if (metric.value > threshold.good) {
    alerts.push(`WARNING: ${metric.name} is ${metric.value}ms (needs improvement, good threshold: ${threshold.good}ms)`)
  }
  
  return alerts
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

function calculateAggregateMetrics(metrics: WebVitalsMetric[]): Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }> {
  const byName: Record<string, number[]> = {}
  
  for (const metric of metrics) {
    if (!byName[metric.name]) {
      byName[metric.name] = []
    }
    byName[metric.name].push(metric.value)
  }
  
  const result: Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }> = {}
  
  for (const [name, values] of Object.entries(byName)) {
    result[name] = {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      p50: Math.round(calculatePercentile(values, 50)),
      p95: Math.round(calculatePercentile(values, 95)),
      p99: Math.round(calculatePercentile(values, 99)),
      count: values.length,
    }
  }
  
  return result
}

async function vitalsHandler(request: NextRequest) {
  try {
    if (request.method === 'POST') {
      const body = await request.json()
      
      if (body.type !== 'web-vital') {
        return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 })
      }
      
      const metric: WebVitalsMetric = {
        name: body.data.name,
        value: body.data.value,
        rating: body.data.rating,
        id: body.data.id,
        navigationType: body.data.navigationType,
        timestamp: new Date().toISOString(),
        url: request.headers.get('referer') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
      
      const alerts = checkAlertThresholds(metric)
      
      const existing = webVitalsStore.get(metric.name) || []
      existing.push(metric)
      
      if (existing.length > 10000) {
        existing.splice(0, existing.length - 10000)
      }
      
      webVitalsStore.set(metric.name, existing)
      
      return NextResponse.json({
        success: true,
        alerts: alerts.length > 0 ? alerts : undefined,
        timestamp: metric.timestamp,
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }
    
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const metricName = url.searchParams.get('metric')
      const timeRange = url.searchParams.get('timeRange') || '3600000'
      
      const cutoff = Date.now() - parseInt(timeRange)
      
      let filteredMetrics: WebVitalsMetric[] = []
      
      if (metricName) {
        const metrics = webVitalsStore.get(metricName) || []
        filteredMetrics = metrics.filter(m => m.timestamp && new Date(m.timestamp).getTime() > cutoff)
      } else {
        for (const metrics of webVitalsStore.values()) {
          filteredMetrics.push(...metrics.filter(m => m.timestamp && new Date(m.timestamp).getTime() > cutoff))
        }
      }
      
      const aggregates = calculateAggregateMetrics(filteredMetrics)
      
      const alerts: string[] = []
      for (const [name, data] of Object.entries(aggregates)) {
        const threshold = ALERT_THRESHOLDS[name.toLowerCase() as keyof AlertThresholds]
        if (threshold && data.avg > threshold.poor) {
          alerts.push(`CRITICAL: ${name} average is ${data.avg}ms (threshold: ${threshold.poor}ms)`)
        }
      }
      
      return NextResponse.json({
        metrics: filteredMetrics.slice(-100),
        aggregates,
        totalCount: filteredMetrics.length,
        thresholds: ALERT_THRESHOLDS,
        alerts: alerts.length > 0 ? alerts : undefined,
        timeRange: timeRange,
        timestamp: new Date().toISOString(),
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }
    
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}

export const POST = withApiRateLimit(vitalsHandler, 'webvitals')
export const GET = withApiRateLimit(vitalsHandler, 'webvitals')