'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWebVitals, WebVitalsReport } from '@/lib/utils/webVitals'
import { logger } from '@/lib/utils/logger'

interface DashboardData {
  summary: {
    totalWebVitalEvents: number
    timestamp: string
    uptime: number
  }
  webVitals: {
    byMetricName: Record<string, { count: number; avg: number; min: number; max: number }>
    events: WebVitalsReport[]
  }
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'good':
      return 'bg-[hsl(var(--color-success))]'
    case 'needs-improvement':
      return 'bg-[hsl(var(--color-warning))]'
    case 'poor':
      return 'bg-[hsl(var(--color-error))]'
    default:
      return 'bg-gray-400'
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-[hsl(var(--color-success))]'
  if (score >= 50) return 'text-[hsl(var(--color-warning))]'
  return 'text-[hsl(var(--color-error))]'
}

function MetricCard({
  title,
  value,
  unit,
  rating,
  description
}: {
  title: string
  value: number
  unit: string
  rating?: string
  description: string
}) {
  return (
    <div className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)] border border-[hsl(var(--color-border))]">
      <h3 className="text-sm font-medium text-[hsl(var(--color-text-muted))]">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[hsl(var(--color-text-primary))]">
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-[hsl(var(--color-text-muted))]">{unit}</span>
      </div>
      {rating && (
        <div className="mt-2 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${getRatingColor(rating)}`} />
          <span className="text-xs text-[hsl(var(--color-text-muted))]">{rating}</span>
        </div>
      )}
      <p className="mt-2 text-xs text-[hsl(var(--color-text-muted))]">{description}</p>
    </div>
  )
}

export default function WebVitalsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/observability/performance')
      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh])

  useWebVitals({
    reportToApi: true,
    reportToAnalytics: (metric) => {
      logger.debug('Web vital recorded', { metric, module: 'dashboard' })
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[hsl(var(--color-secondary))] rounded w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-[hsl(var(--color-secondary))] rounded-[var(--radius-lg)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[hsl(var(--color-error))]/10 border border-[hsl(var(--color-error))] rounded-[var(--radius-lg)] p-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--color-error))]">Error</h2>
            <p className="text-[hsl(var(--color-text-secondary))]">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-[var(--radius-md)]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const metrics = data?.webVitals?.byMetricName || {}
  const totalEvents = data?.summary?.totalWebVitalEvents || 0

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--color-text-primary))]">
              Core Web Vitals
            </h1>
            <p className="text-[hsl(var(--color-text-muted))] mt-1">
              Real-time performance monitoring dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-[hsl(var(--color-border))]"
              />
              <span className="text-sm text-[hsl(var(--color-text-secondary))]">
                Auto-refresh (30s)
              </span>
            </label>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-primary-dark))] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="FCP"
            value={metrics.FCP?.avg || 0}
            unit="ms"
            description="First Contentful Paint"
          />
          <MetricCard
            title="LCP"
            value={metrics.LCP?.avg || 0}
            unit="ms"
            description="Largest Contentful Paint"
          />
          <MetricCard
            title="CLS"
            value={metrics.CLS?.avg || 0}
            unit=""
            description="Cumulative Layout Shift"
          />
          <MetricCard
            title="INP"
            value={metrics.INP?.avg || 0}
            unit="ms"
            description="Interaction to Next Paint"
          />
          <MetricCard
            title="TTFB"
            value={metrics.TTFB?.avg || 0}
            unit="ms"
            description="Time to First Byte"
          />
        </div>

        <div className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-md)] border border-[hsl(var(--color-border))] mb-8">
          <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-4">
            Performance Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-[hsl(var(--color-text-muted))]">Total Events</p>
              <p className="text-2xl font-bold text-[hsl(var(--color-text-primary))]">{totalEvents}</p>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--color-text-muted))]">Uptime</p>
              <p className="text-2xl font-bold text-[hsl(var(--color-text-primary))]">
                {Math.floor((data?.summary?.uptime || 0) / 3600)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--color-text-muted))]">Last Updated</p>
              <p className="text-lg font-medium text-[hsl(var(--color-text-primary))]">
                {data?.summary?.timestamp 
                  ? new Date(data.summary.timestamp).toLocaleTimeString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--color-text-muted))]">Overall Health</p>
              <p className={`text-2xl font-bold ${getScoreColor(
                (Object.values(metrics).reduce((acc, m) => acc + m.avg, 0) / (Object.keys(metrics).length || 1)) < 100 ? 80 : 50
              )}`}>
                {totalEvents > 0 ? 'Good' : 'No Data'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-md)] border border-[hsl(var(--color-border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-4">
            Metric Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--color-border))]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[hsl(var(--color-text-muted))]">
                    Metric
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[hsl(var(--color-text-muted))]">
                    Count
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[hsl(var(--color-text-muted))]">
                    Avg
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[hsl(var(--color-text-muted))]">
                    Min
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[hsl(var(--color-text-muted))]">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([name, stats]) => (
                  <tr key={name} className="border-b border-[hsl(var(--color-border))]">
                    <td className="py-3 px-4 font-medium text-[hsl(var(--color-text-primary))]">
                      {name}
                    </td>
                    <td className="py-3 px-4 text-right text-[hsl(var(--color-text-secondary))]">
                      {stats.count}
                    </td>
                    <td className="py-3 px-4 text-right text-[hsl(var(--color-text-primary))]">
                      {stats.avg.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-[hsl(var(--color-text-secondary))]">
                      {stats.min.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-[hsl(var(--color-text-secondary))]">
                      {stats.max.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
