'use client'

import { useEffect, useState, useCallback } from 'react'

interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
}

interface MetricStats {
  count: number
  avg: number
  min: number
  max: number
}

interface WebVitalsData {
  events: WebVitalsMetric[]
  byMetricName: Record<string, MetricStats>
}

interface PerformanceData {
  summary: {
    totalApiCalls: number
    totalWebVitalEvents: number
    timestamp: string
    uptime: number
  }
  webVitals: WebVitalsData
}

const METRIC_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
}

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[metricName as keyof typeof METRIC_THRESHOLDS]
  if (!thresholds) return 'needs-improvement'
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'good': return 'hsl(142 76% 36%)'
    case 'needs-improvement': return 'hsl(38 92% 50%)'
    case 'poor': return 'hsl(0 84% 60%)'
    default: return 'hsl(220 10% 45%)'
  }
}

function SimpleBarChart({ 
  data, 
  metricName, 
  maxValue 
}: { 
  data: number[]; 
  metricName: string; 
  maxValue: number 
}) {
  const width = 200
  const height = 40
  const barWidth = width / Math.max(data.length, 1)
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((value, index) => {
        const barHeight = (value / maxValue) * height
        const rating = getRating(metricName, value)
        return (
          <rect
            key={index}
            x={index * barWidth + 1}
            y={height - barHeight}
            width={barWidth - 2}
            height={barHeight}
            fill={getRatingColor(rating)}
            rx={2}
            className="transition-all duration-300"
          />
        )
      })}
    </svg>
  )
}

function MetricCard({ 
  name, 
  stats, 
  recentValues 
}: { 
  name: string; 
  stats: MetricStats; 
  recentValues: number[] 
}) {
  const maxValue = METRIC_THRESHOLDS[name as keyof typeof METRIC_THRESHOLDS]?.poor || stats.max * 1.2
  
  return (
    <div className="bg-[hsl(var(--color-surface))] rounded-lg p-4 shadow-sm border border-[hsl(var(--color-border))]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-[hsl(var(--color-text-primary))]">{name}</h3>
          <p className="text-xs text-[hsl(var(--color-text-muted))]">Lower is better</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[hsl(var(--color-text-primary))]">
            {stats.avg.toFixed(0)}
          </div>
          <div className="text-xs text-[hsl(var(--color-text-muted))]">avg</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <div className="text-[hsl(var(--color-text-muted))]">Min</div>
          <div className="font-medium">{stats.min.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-[hsl(var(--color-text-muted))]">Max</div>
          <div className="font-medium">{stats.max.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-[hsl(var(--color-text-muted))]">Samples</div>
          <div className="font-medium">{stats.count}</div>
        </div>
      </div>
      
      {recentValues.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-[hsl(var(--color-text-muted))] mb-1">Recent values</p>
          <SimpleBarChart data={recentValues} metricName={name} maxValue={maxValue} />
        </div>
      )}
    </div>
  )
}

export default function VitalsPage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/observability/performance', {
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed to fetch data')
      const json = await response.json()
      setData(json)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))] p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-[hsl(var(--color-text-primary))]">
            Core Web Vitals Dashboard
          </h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))] p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-[hsl(var(--color-text-primary))]">
            Core Web Vitals Dashboard
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  const webVitals = data?.webVitals
  const metrics = ['LCP', 'FID', 'CLS', 'INP', 'FCP', 'TTFB']

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--color-text-primary))]">
              Core Web Vitals Dashboard
            </h1>
            <p className="text-sm text-[hsl(var(--color-text-muted))]">
              Real-time performance monitoring
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-md text-sm hover:opacity-90 transition-opacity"
            >
              Refresh
            </button>
            {lastUpdated && (
              <p className="text-xs text-[hsl(var(--color-text-muted))] mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-[hsl(var(--color-surface))] rounded-lg p-4 shadow-sm border border-[hsl(var(--color-border))]">
            <p className="text-sm text-[hsl(var(--color-text-muted))]">Total Events</p>
            <p className="text-3xl font-bold text-[hsl(var(--color-text-primary))]">
              {data?.summary.totalWebVitalEvents || 0}
            </p>
          </div>
          <div className="bg-[hsl(var(--color-surface))] rounded-lg p-4 shadow-sm border border-[hsl(var(--color-border))]">
            <p className="text-sm text-[hsl(var(--color-text-muted))]">Uptime</p>
            <p className="text-3xl font-bold text-[hsl(var(--color-text-primary))]">
              {Math.floor(data?.summary.uptime || 0)}s
            </p>
          </div>
          <div className="bg-[hsl(var(--color-surface))] rounded-lg p-4 shadow-sm border border-[hsl(var(--color-border))]">
            <p className="text-sm text-[hsl(var(--color-text-muted))]">API Calls</p>
            <p className="text-3xl font-bold text-[hsl(var(--color-text-primary))]">
              {data?.summary.totalApiCalls || 0}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 text-[hsl(var(--color-text-primary))]">
          Metrics Breakdown
        </h2>
        
        {webVitals?.byMetricName && Object.keys(webVitals.byMetricName).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map(metricName => {
              const stats = webVitals.byMetricName[metricName]
              if (!stats) return null
              
              const recentValues = webVitals.events
                .filter(e => e.name === metricName)
                .slice(-20)
                .map(e => e.value)
              
              return (
                <MetricCard
                  key={metricName}
                  name={metricName}
                  stats={stats}
                  recentValues={recentValues}
                />
              )
            })}
          </div>
        ) : (
          <div className="bg-[hsl(var(--color-surface))] rounded-lg p-8 text-center border border-[hsl(var(--color-border))]">
            <p className="text-[hsl(var(--color-text-muted))]">
              No web vitals data collected yet. Data will appear as users browse the site.
            </p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-[hsl(var(--color-text-primary))]">
            Performance Thresholds
          </h2>
          <div className="bg-[hsl(var(--color-surface))] rounded-lg p-4 border border-[hsl(var(--color-border))]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(METRIC_THRESHOLDS).map(([name, thresholds]) => (
                <div key={name}>
                  <p className="font-medium text-[hsl(var(--color-text-primary))]">{name}</p>
                  <p className="text-[hsl(var(--color-text-muted))]">
                    Good: ≤{thresholds.good}
                  </p>
                  <p className="text-[hsl(var(--color-text-muted))]">
                    Poor: &gt;{thresholds.poor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
