'use client'

import { 
  PerformanceMetrics, 
  WEB_VITALS_THRESHOLDS,
  getRating,
  formatMetricValue,
  getRatingColor,
  getMetricUnit
} from '@/lib/types/dashboard'
import { useEffect, useState, useCallback } from 'react'

interface MetricCardProps {
  name: string
  avg: number
  min: number
  max: number
  count: number
}

function MetricCard({ name, avg, min, max, count }: MetricCardProps) {
  const rating = getRating(name, avg)
  const color = getRatingColor(rating)
  const unit = getMetricUnit(name)
  
  return (
    <div className="metric-card">
      <div className="metric-header">
        <h3 className="metric-name">{name}</h3>
        <span 
          className="metric-badge"
          style={{ backgroundColor: color }}
        >
          {rating === 'good' ? 'Good' : rating === 'needs-improvement' ? 'Needs Work' : 'Poor'}
        </span>
      </div>
      <div className="metric-value" style={{ color }}>
        {formatMetricValue(name, avg)}{unit && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-stats">
        <div className="stat">
          <span className="stat-label">Count</span>
          <span className="stat-value">{count}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Min</span>
          <span className="stat-value">{formatMetricValue(name, min)}{unit && unit}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Max</span>
          <span className="stat-value">{formatMetricValue(name, max)}{unit && unit}</span>
        </div>
      </div>
      <div className="metric-bar">
        <div 
          className="metric-bar-fill"
          style={{ 
            width: `${Math.min(100, (avg / WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS].needsImprovement) * 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
      <style jsx>{`
        .metric-card {
          background: hsl(var(--color-surface));
          border: 1px solid hsl(var(--color-border));
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          transition: box-shadow var(--transition-normal);
        }
        .metric-card:hover {
          box-shadow: var(--shadow-md);
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }
        .metric-name {
          font-size: var(--text-lg);
          font-weight: 600;
          color: hsl(var(--color-text-primary));
          margin: 0;
        }
        .metric-badge {
          font-size: var(--text-xs);
          color: white;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }
        .metric-value {
          font-size: var(--text-3xl);
          font-weight: 700;
          margin-bottom: var(--spacing-md);
        }
        .metric-unit {
          font-size: var(--text-lg);
          font-weight: 400;
          margin-left: 2px;
        }
        .metric-stats {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: var(--text-xs);
          color: hsl(var(--color-text-muted));
          text-transform: uppercase;
        }
        .stat-value {
          font-size: var(--text-sm);
          font-weight: 500;
          color: hsl(var(--color-text-secondary));
        }
        .metric-bar {
          height: 4px;
          background: hsl(var(--color-secondary-dark));
          border-radius: 2px;
          overflow: hidden;
        }
        .metric-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width var(--transition-normal);
        }
      `}</style>
    </div>
  )
}

interface WebVitalsGridProps {
  metrics: PerformanceMetrics['webVitals']
}

function WebVitalsGrid({ metrics }: WebVitalsGridProps) {
  const metricNames = ['LCP', 'FCP', 'INP', 'CLS', 'TTFB'] as const
  
  return (
    <div className="web-vitals-grid">
      {metricNames.map(name => {
        const data = metrics.byMetricName[name]
        if (!data) {
          return (
            <div key={name} className="metric-card metric-empty">
              <div className="metric-header">
                <h3 className="metric-name">{name}</h3>
              </div>
              <div className="no-data">No data yet</div>
            </div>
          )
        }
        return (
          <MetricCard
            key={name}
            name={name}
            avg={data.avg}
            min={data.min}
            max={data.max}
            count={data.count}
          />
        )
      })}
      <style jsx>{`
        .web-vitals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
        }
        .metric-empty {
          opacity: 0.7;
        }
        .no-data {
          color: hsl(var(--color-text-muted));
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  )
}

interface ResourceCardProps {
  label: string
  value: number
  unit?: string
  color?: string
}

function ResourceCard({ label, value, unit = '%', color }: ResourceCardProps) {
  return (
    <div className="resource-card">
      <span className="resource-label">{label}</span>
      <span 
        className="resource-value"
        style={color ? { color } : undefined}
      >
        {value}{unit}
      </span>
      <style jsx>{`
        .resource-card {
          background: hsl(var(--color-surface));
          border: 1px solid hsl(var(--color-border));
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
        }
        .resource-label {
          font-size: var(--text-xs);
          color: hsl(var(--color-text-muted));
          text-transform: uppercase;
        }
        .resource-value {
          font-size: var(--text-xl);
          font-weight: 600;
          color: hsl(var(--color-text-primary));
        }
      `}</style>
    </div>
  )
}

interface SummaryCardsProps {
  summary: PerformanceMetrics['summary']
  apiResponse: PerformanceMetrics['apiResponse']
}

function SummaryCards({ summary, apiResponse }: SummaryCardsProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
  
  return (
    <div className="summary-cards">
      <div className="summary-card">
        <span className="summary-label">Total Events</span>
        <span className="summary-value">{summary.totalWebVitalEvents}</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">API Calls</span>
        <span className="summary-value">{summary.totalApiCalls}</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">API Avg</span>
        <span className="summary-value">{apiResponse.avg}ms</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">Uptime</span>
        <span className="summary-value">{formatUptime(summary.uptime)}</span>
      </div>
      <style jsx>{`
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        .summary-card {
          background: hsl(var(--color-surface));
          border: 1px solid hsl(var(--color-border));
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
        }
        .summary-label {
          font-size: var(--text-xs);
          color: hsl(var(--color-text-muted));
          text-transform: uppercase;
        }
        .summary-value {
          font-size: var(--text-lg);
          font-weight: 600;
          color: hsl(var(--color-text-primary));
        }
      `}</style>
    </div>
  )
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/observability/performance', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setMetrics(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [fetchMetrics])
  
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading performance metrics...</p>
        <style jsx>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: var(--spacing-md);
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid hsl(var(--color-secondary-dark));
            border-top-color: hsl(var(--color-primary));
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            color: hsl(var(--color-text-muted));
          }
        `}</style>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Metrics</h2>
        <p>{error}</p>
        <button onClick={fetchMetrics}>Retry</button>
        <style jsx>{`
          .dashboard-error {
            text-align: center;
            padding: var(--spacing-2xl);
          }
          h2 {
            color: hsl(var(--color-primary));
            margin-bottom: var(--spacing-sm);
          }
          p {
            color: hsl(var(--color-text-muted));
            margin-bottom: var(--spacing-lg);
          }
          button {
            background: hsl(var(--color-primary));
            color: white;
            border: none;
            padding: var(--spacing-sm) var(--spacing-lg);
            border-radius: var(--radius-md);
            cursor: pointer;
            font-weight: 500;
            transition: background var(--transition-fast);
          }
          button:hover {
            background: hsl(var(--color-primary-dark));
          }
        `}</style>
      </div>
    )
  }
  
  if (!metrics) return null
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Core Web Vitals Dashboard</h1>
          <p className="dashboard-subtitle">Real-time performance monitoring</p>
        </div>
        <div className="last-updated">
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button onClick={fetchMetrics} className="refresh-btn" aria-label="Refresh metrics">
            ↻
          </button>
        </div>
      </header>
      
      <SummaryCards summary={metrics.summary} apiResponse={metrics.apiResponse} />
      
      <section className="dashboard-section">
        <h2>Core Web Vitals</h2>
        <WebVitalsGrid metrics={metrics.webVitals} />
      </section>
      
      <section className="dashboard-section">
        <h2>Resource Utilization</h2>
        <div className="resource-grid">
          <ResourceCard 
            label="CPU" 
            value={metrics.resourceUtilization.current?.cpuUsagePercent ?? 0} 
          />
          <ResourceCard 
            label="Memory" 
            value={metrics.resourceUtilization.current?.memoryUsagePercent ?? 0} 
          />
          <ResourceCard 
            label="Heap" 
            value={metrics.resourceUtilization.current?.heapPercent ?? 0} 
          />
          <ResourceCard 
            label="Memory Used" 
            value={metrics.resourceUtilization.current?.memoryUsageMB ?? 0} 
            unit="MB"
          />
        </div>
      </section>
      
      {metrics.errorRates.length > 0 && (
        <section className="dashboard-section">
          <h2>Error Rates</h2>
          <div className="error-table">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Error Type</th>
                  <th>Count</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.errorRates.map((error, idx) => (
                  <tr key={idx}>
                    <td>{error.endpoint}</td>
                    <td><span className="method-badge">{error.method}</span></td>
                    <td>{error.errorType}</td>
                    <td>{error.count}</td>
                    <td>{(error.rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      <style jsx>{`
        .dashboard {
          padding: var(--spacing-xl);
          max-width: 1400px;
          margin: 0 auto;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }
        .dashboard-header h1 {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: hsl(var(--color-text-primary));
          margin: 0;
        }
        .dashboard-subtitle {
          color: hsl(var(--color-text-muted));
          margin: var(--spacing-xs) 0 0;
        }
        .last-updated {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: hsl(var(--color-text-muted));
          font-size: var(--text-sm);
        }
        .refresh-btn {
          background: hsl(var(--color-secondary-dark));
          border: none;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-lg);
          color: hsl(var(--color-text-secondary));
          transition: all var(--transition-fast);
        }
        .refresh-btn:hover {
          background: hsl(var(--color-primary));
          color: white;
        }
        .dashboard-section {
          margin-bottom: var(--spacing-2xl);
        }
        .dashboard-section h2 {
          font-size: var(--text-xl);
          font-weight: 600;
          color: hsl(var(--color-text-primary));
          margin: 0 0 var(--spacing-lg);
        }
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
        }
        .error-table {
          overflow-x: auto;
          background: hsl(var(--color-surface));
          border: 1px solid hsl(var(--color-border));
          border-radius: var(--radius-lg);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: var(--spacing-md);
          text-align: left;
          border-bottom: 1px solid hsl(var(--color-border));
        }
        th {
          font-size: var(--text-xs);
          text-transform: uppercase;
          color: hsl(var(--color-text-muted));
          font-weight: 600;
        }
        td {
          font-size: var(--text-sm);
          color: hsl(var(--color-text-secondary));
        }
        tr:last-child td {
          border-bottom: none;
        }
        .method-badge {
          background: hsl(var(--color-secondary-dark));
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
