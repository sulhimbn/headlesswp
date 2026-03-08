'use client'

import { useState, useEffect, memo, useCallback } from 'react'

interface WebVitalsMetricData {
  count: number
  avg: number
  min: number
  max: number
}

interface WebVitalsEvent {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
}

interface WebVitalsResponse {
  summary: {
    totalApiCalls: number
    totalErrorTypes: number
    totalWebVitalEvents: number
    timestamp: string
    uptime: number
  }
  webVitals: {
    events: WebVitalsEvent[]
    byMetricName: Record<string, WebVitalsMetricData>
  }
}

interface MetricConfig {
  name: string
  fullName: string
  unit: string
  goodThreshold: number
  needsImprovementThreshold: number
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  FCP: { name: 'FCP', fullName: 'First Contentful Paint', unit: 'ms', goodThreshold: 1800, needsImprovementThreshold: 3000 },
  LCP: { name: 'LCP', fullName: 'Largest Contentful Paint', unit: 'ms', goodThreshold: 2500, needsImprovementThreshold: 4000 },
  CLS: { name: 'CLS', fullName: 'Cumulative Layout Shift', unit: '', goodThreshold: 0.1, needsImprovementThreshold: 0.25 },
  INP: { name: 'INP', fullName: 'Interaction to Next Paint', unit: 'ms', goodThreshold: 200, needsImprovementThreshold: 500 },
  TTFB: { name: 'TTFB', fullName: 'Time to First Byte', unit: 'ms', goodThreshold: 800, needsImprovementThreshold: 1800 }
}

const POLL_INTERVAL = 10000

const ratingStyles = {
  good: {
    bg: 'bg-[hsl(var(--color-success))]',
    text: 'text-[hsl(var(--color-success))]',
    border: 'border-[hsl(var(--color-success))]',
    label: 'Good'
  },
  'needs-improvement': {
    bg: 'bg-[hsl(var(--color-warning))]',
    text: 'text-[hsl(var(--color-warning))]',
    border: 'border-[hsl(var(--color-warning))]',
    label: 'Needs Improvement'
  },
  poor: {
    bg: 'bg-[hsl(var(--color-error))]',
    text: 'text-[hsl(var(--color-error))]',
    border: 'border-[hsl(var(--color-error))]',
    label: 'Poor'
  }
}

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const config = METRIC_CONFIGS[metricName]
  if (!config) return 'needs-improvement'
  
  if (value <= config.goodThreshold) return 'good'
  if (value <= config.needsImprovementThreshold) return 'needs-improvement'
  return 'poor'
}

function formatValue(value: number, unit: string): string {
  if (unit === '') return value.toFixed(3)
  return `${Math.round(value)}`
}

function MetricCard({ 
  metricName, 
  data,
  latestEvent 
}: { 
  metricName: string
  data?: WebVitalsMetricData
  latestEvent?: WebVitalsEvent
}) {
  const config = METRIC_CONFIGS[metricName]
  if (!config) return null

  const avgValue = data?.avg ?? latestEvent?.value ?? 0
  const rating = latestEvent ? latestEvent.rating : getRating(metricName, avgValue)
  const styles = ratingStyles[rating]
  const count = data?.count ?? 0

  return (
    <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-[hsl(var(--color-text))]">{metricName}</h3>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles.bg} text-white`}>
          {styles.label}
        </span>
      </div>
      <p className="text-sm text-[hsl(var(--color-text-secondary))] mb-3">{config.fullName}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${styles.text}`}>
          {formatValue(avgValue, config.unit)}
        </span>
        <span className="text-sm text-[hsl(var(--color-text-secondary))]">{config.unit}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-[hsl(var(--color-border))] text-xs text-[hsl(var(--color-text-secondary))]">
        <div className="flex justify-between">
          <span>Samples: {count}</span>
          {data && (
            <>
              <span>Min: {formatValue(data.min, config.unit)}</span>
              <span>Max: {formatValue(data.max, config.unit)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CoreWebVitalsDashboardComponent() {
  const [metrics, setMetrics] = useState<WebVitalsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/api/observability/performance', {
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: WebVitalsResponse = await response.json()
      setMetrics(data)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  if (loading && !metrics) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[hsl(var(--color-muted))] rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 bg-[hsl(var(--color-muted))] rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-[hsl(var(--color-error))] mb-2">Failed to load metrics</p>
        <p className="text-sm text-[hsl(var(--color-text-secondary))]">{error}</p>
      </div>
    )
  }

  const webVitals = metrics?.webVitals
  const byMetricName = webVitals?.byMetricName
  const events = webVitals?.events ?? []
  const metricNames = ['FCP', 'LCP', 'CLS', 'INP', 'TTFB'] as const

  const getLatestEvent = (name: string): WebVitalsEvent | undefined => {
    return events.filter(e => e.name === name).pop()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--color-text))]">Core Web Vitals</h2>
          <p className="text-sm text-[hsl(var(--color-text-secondary))]">
            Real-time user-centric performance metrics
          </p>
        </div>
        {lastUpdated && (
          <div className="text-xs text-[hsl(var(--color-text-secondary))]">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricNames.map(name => (
          <MetricCard
            key={name}
            metricName={name}
            data={byMetricName?.[name]}
            latestEvent={getLatestEvent(name)}
          />
        ))}
      </div>

      <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--color-text))] mb-4">
          Recent Events ({events.length} total)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]">
                <th className="text-left py-2 px-3 text-[hsl(var(--color-text-secondary))]">Metric</th>
                <th className="text-left py-2 px-3 text-[hsl(var(--color-text-secondary))]">Value</th>
                <th className="text-left py-2 px-3 text-[hsl(var(--color-text-secondary))]">Rating</th>
                <th className="text-left py-2 px-3 text-[hsl(var(--color-text-secondary))]">Navigation</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(-20).reverse().map((event, idx) => {
                const styles = ratingStyles[event.rating]
                return (
                  <tr key={`${event.id}-${idx}`} className="border-b border-[hsl(var(--color-border))] last:border-0">
                    <td className="py-2 px-3 font-medium text-[hsl(var(--color-text))]">{event.name}</td>
                    <td className="py-2 px-3 text-[hsl(var(--color-text))]">
                      {formatValue(event.value, METRIC_CONFIGS[event.name]?.unit ?? '')}
                      {METRIC_CONFIGS[event.name]?.unit}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles.bg} text-white`}>
                        {styles.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[hsl(var(--color-text-secondary))]">
                      {event.navigationType || 'n/a'}
                    </td>
                  </tr>
                )
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[hsl(var(--color-text-secondary))]">
                    No web vitals events recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default memo(CoreWebVitalsDashboardComponent)
