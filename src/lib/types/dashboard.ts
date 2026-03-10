export interface WebVitalsMetricData {
  name: 'FCP' | 'LCP' | 'TTFB' | 'CLS' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
}

export interface WebVitalsSummary {
  count: number
  avg: number
  min: number
  max: number
  p50?: number
  p95?: number
}

export interface PerformanceMetrics {
  summary: {
    totalApiCalls: number
    totalErrorTypes: number
    totalWebVitalEvents: number
    timestamp: string
    uptime: number
  }
  apiResponse: {
    total: number
    p50: number
    p95: number
    p99: number
    avg: number
    min: number
    max: number
    byEndpoint: Record<string, { count: number; p50: number; p95: number; p99: number; avg: number }>
  }
  resourceUtilization: {
    current: {
      cpuUsagePercent: number
      memoryUsageMB: number
      memoryUsagePercent: number
      heapUsedMB: number
      heapTotalMB: number
      heapPercent: number
    }
    avgCpuUsage: number
    avgMemoryUsage: number
    avgHeapUsage: number
  }
  errorRates: Array<{
    endpoint: string
    method: string
    errorType: string
    count: number
    totalRequests: number
    rate: number
  }>
  webVitals: {
    events: WebVitalsMetricData[]
    byMetricName: Record<string, WebVitalsSummary>
  }
}

export const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  INP: { good: 200, needsImprovement: 500 }
} as const

export function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName as keyof typeof WEB_VITALS_THRESHOLDS]
  if (!thresholds) return 'needs-improvement'
  
  if (metricName === 'CLS') {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.needsImprovement) return 'needs-improvement'
    return 'poor'
  }
  
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}

export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'hsl(var(--color-primary))'
    case 'needs-improvement':
      return 'hsl(45, 90%, 50%)'
    case 'poor':
      return 'hsl(0, 84%, 40%)'
  }
}

export function getMetricUnit(name: string): string {
  switch (name) {
    case 'CLS':
      return ''
    default:
      return 'ms'
  }
}
