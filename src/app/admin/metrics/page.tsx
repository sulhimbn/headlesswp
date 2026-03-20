'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { performanceMetricsCollector, WebVitalsMetric } from '@/lib/api/performanceMetrics'

interface MetricThresholds {
  good: number
  needsImprovement: number
  poor: number
}

const METRIC_THRESHOLDS: Record<string, MetricThresholds> = {
  LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
  FID: { good: 100, needsImprovement: 300, poor: 300 },
  INP: { good: 200, needsImprovement: 500, poor: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  TTFB: { good: 800, needsImprovement: 1800, poor: 1800 },
  FCP: { good: 1800, needsImprovement: 3000, poor: 3000 },
}

function getRating(value: number, metricName: string): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[metricName] || { good: Infinity, needsImprovement: Infinity, poor: Infinity }
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}

function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'bg-[hsl(var(--color-success))]'
    case 'needs-improvement':
      return 'bg-[hsl(var(--color-warning))]'
    case 'poor':
      return 'bg-[hsl(var(--color-error))]'
  }
}

function getRatingTextColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'text-[hsl(var(--color-success))]'
    case 'needs-improvement':
      return 'text-[hsl(var(--color-warning))]'
    case 'poor':
      return 'text-[hsl(var(--color-error))]'
  }
}

function formatValue(value: number, metricName: string): string {
  if (metricName === 'CLS') {
    return value.toFixed(4)
  }
  return `${value.toFixed(0)}ms`
}

function getUnit(metricName: string): string {
  if (metricName === 'CLS') return 'score'
  return 'ms'
}

interface MetricCardProps {
  name: string
  latestValue: number | null
  avgValue: number | null
  p95Value: number | null
  count: number
}

function MetricCard({ name, latestValue, avgValue, p95Value, count }: MetricCardProps) {
  const rating = latestValue !== null ? getRating(latestValue, name) : null
  const thresholds = METRIC_THRESHOLDS[name] || { good: 0, needsImprovement: 0, poor: 0 }

  return (
    <div className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 border border-[hsl(var(--color-border))]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">{name}</h3>
        {rating && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRatingColor(rating)}`}>
            {rating === 'needs-improvement' ? 'Needs Improvement' : rating.charAt(0).toUpperCase() + rating.slice(1)}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[hsl(var(--color-text-muted))]">Latest</p>
          <p className={`text-3xl font-bold ${rating ? getRatingTextColor(rating) : ''}`}>
            {latestValue !== null ? formatValue(latestValue, name) : '-'}
          </p>
          <p className="text-xs text-[hsl(var(--color-text-muted))]">{getUnit(name)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[hsl(var(--color-text-muted))]">Average</p>
            <p className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">
              {avgValue !== null ? formatValue(avgValue, name) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--color-text-muted))]">P95</p>
            <p className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">
              {p95Value !== null ? formatValue(p95Value, name) : '-'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[hsl(var(--color-border))]">
          <div className="flex justify-between text-xs text-[hsl(var(--color-text-muted))]">
            <span>Good: ≤ {formatValue(thresholds.good, name)}</span>
            <span>Poor: &gt; {formatValue(thresholds.needsImprovement, name)}</span>
          </div>
          <div className="mt-2 h-2 bg-[hsl(var(--color-secondary-dark))] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rating ? getRatingColor(rating) : 'bg-[hsl(var(--color-text-muted))]'}`}
              style={{
                width: latestValue !== null 
                  ? `${Math.min(100, (latestValue / thresholds.poor) * 100)}%` 
                  : '0%'
              }}
            />
          </div>
        </div>

        <p className="text-xs text-[hsl(var(--color-text-muted))]">
          {count} {count === 1 ? 'event' : 'events'} recorded
        </p>
      </div>
    </div>
  )
}

interface EventHistoryProps {
  events: WebVitalsMetric[]
}

function EventHistory({ events }: EventHistoryProps) {
  const recentEvents = events.slice(-20).reverse()

  return (
    <div className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 border border-[hsl(var(--color-border))]">
      <h3 className="text-lg font-semibold text-[hsl(var(--color-text-primary))] mb-4">Recent Events</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--color-border))]">
              <th className="text-left py-2 px-3 text-[hsl(var(--color-text-muted))]">Metric</th>
              <th className="text-left py-2 px-3 text-[hsl(var(--color-text-muted))]">Value</th>
              <th className="text-left py-2 px-3 text-[hsl(var(--color-text-muted))]">Rating</th>
              <th className="text-left py-2 px-3 text-[hsl(var(--color-text-muted))]">Navigation</th>
              <th className="text-left py-2 px-3 text-[hsl(var(--color-text-muted))]">ID</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[hsl(var(--color-text-muted))]">
                  No events recorded yet
                </td>
              </tr>
            ) : (
              recentEvents.map((event, index) => (
                <tr key={`${event.id}-${index}`} className="border-b border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-secondary-dark))]">
                  <td className="py-2 px-3 font-medium text-[hsl(var(--color-text-primary))]">{event.name}</td>
                  <td className="py-2 px-3 text-[hsl(var(--color-text-primary))]">{formatValue(event.value, event.name)}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getRatingColor(event.rating)}`}>
                      {event.rating === 'needs-improvement' ? 'NI' : event.rating[0].toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[hsl(var(--color-text-muted))]">{event.navigationType || '-'}</td>
                  <td className="py-2 px-3 text-[hsl(var(--color-text-muted))] font-mono text-xs">{event.id.slice(0, 8)}...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface AggregatedMetrics {
  byMetricName: Record<string, { count: number; avg: number; min: number; max: number; p95: number }>
  events: WebVitalsMetric[]
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<AggregatedMetrics>({ byMetricName: {}, events: [] })
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | 'all'>('24h')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMetrics = useCallback(() => {
    const webVitalsMetrics = performanceMetricsCollector.getWebVitalsMetrics()
    
    const now = Date.now()
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }
    const cutoff = now - timeRanges[timeRange]

    const filteredEvents = webVitalsMetrics.events.filter(event => {
      const eventTime = new Date(event.id.split('-')[0]).getTime()
      return eventTime > cutoff || isNaN(eventTime)
    })

    const byMetricName: Record<string, { count: number; avg: number; min: number; max: number; p95: number }> = {}
    
    const metricGroups: Record<string, number[]> = {}
    for (const event of filteredEvents) {
      if (!metricGroups[event.name]) {
        metricGroups[event.name] = []
      }
      metricGroups[event.name].push(event.value)
    }

    for (const [name, values] of Object.entries(metricGroups)) {
      const sorted = [...values].sort((a, b) => a - b)
      const p95Index = Math.floor(sorted.length * 0.95)
      byMetricName[name] = {
        count: sorted.length,
        avg: sorted.reduce((sum, v) => sum + v, 0) / sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[p95Index] || sorted[sorted.length - 1]
      }
    }

    setMetrics({ byMetricName, events: filteredEvents })
    setLastUpdated(new Date())
    setIsLoading(false)
  }, [timeRange])

  useEffect(() => {
    if (!isAuthenticated) return
    
    fetchMetrics()
    
    intervalRef.current = setInterval(fetchMetrics, 5000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAuthenticated, fetchMetrics])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_METRICS_PASSWORD || 'admin123'
    if (password === adminPassword) {
      setIsAuthenticated(true)
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))] flex items-center justify-center p-4">
        <div className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-2">Core Web Vitals Dashboard</h1>
          <p className="text-[hsl(var(--color-text-muted))] mb-6">Enter admin password to access the dashboard</p>
          
          <form onSubmit={handleAuth}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--color-text-primary))] mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-text-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                placeholder="Enter password"
              />
              {authError && (
                <p className="mt-2 text-sm text-[hsl(var(--color-error))]">Invalid password</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[hsl(var(--color-primary))] text-white px-4 py-2 rounded-[var(--radius-md)] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 transition-opacity"
            >
              Access Dashboard
            </button>
          </form>
          
          <p className="mt-4 text-xs text-[hsl(var(--color-text-muted))] text-center">
            For demo purposes, use: admin123
          </p>
        </div>
      </div>
    )
  }

  const metricNames = ['LCP', 'FID', 'INP', 'CLS', 'TTFB', 'FCP']

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <header className="bg-[hsl(var(--color-surface))] shadow-[var(--shadow-sm)] border-b border-[hsl(var(--color-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--color-text-primary))]">Core Web Vitals Dashboard</h1>
              <p className="text-sm text-[hsl(var(--color-text-muted))]">
                Real-time monitoring • Auto-refresh every 5s
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="timeRange" className="text-sm text-[hsl(var(--color-text-muted))]">Time Range:</label>
                <select
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | 'all')}
                  className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-text-primary))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              {lastUpdated && (
                <span className="text-xs text-[hsl(var(--color-text-muted))]">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-3 py-1.5 text-sm text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--color-primary))] border-t-transparent"></div>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-4">Current Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metricNames.map(name => {
                  const metricData = metrics.byMetricName[name]
                  return (
                    <MetricCard
                      key={name}
                      name={name}
                      latestValue={metricData?.max || null}
                      avgValue={metricData?.avg || null}
                      p95Value={metricData?.p95 || null}
                      count={metricData?.count || 0}
                    />
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-4">Event History</h2>
              <EventHistory events={metrics.events} />
            </section>
          </>
        )}
      </main>

      <footer className="bg-[hsl(var(--color-surface))] border-t border-[hsl(var(--color-border))] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-[hsl(var(--color-text-muted))]">
              Core Web Vitals thresholds based on Google&apos;s performance guidelines
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--color-success))]"></span>
                Good
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--color-warning))]"></span>
                Needs Improvement
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--color-error))]"></span>
                Poor
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
