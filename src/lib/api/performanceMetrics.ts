import * as os from 'os'
import { telemetryCollector } from './telemetry'

export interface PerformanceMetric {
  timestamp: string
  value: number
  unit: string
  tags?: Record<string, string>
}

export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'TTFB' | 'CLS' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
}

export interface ApiResponseTimeMetric {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  cacheHit: boolean
  retryCount?: number
}

export interface ResourceUtilizationMetric {
  cpuUsagePercent: number
  memoryUsageMB: number
  memoryUsagePercent: number
  heapUsedMB: number
  heapTotalMB: number
  heapPercent: number
}

export interface ErrorRateMetric {
  endpoint: string
  method: string
  errorType: string
  count: number
  totalRequests: number
  rate: number
}

export class PerformanceMetricsCollector {
  private apiResponseTimes: ApiResponseTimeMetric[] = []
  private resourceMetrics: ResourceUtilizationMetric[] = []
  private errorRates: Map<string, ErrorRateMetric> = new Map()
  private maxApiMetrics = 1000
  private maxResourceMetrics = 100

  recordWebVital(metric: WebVitalsMetric): void {
    telemetryCollector.record({
      type: 'web-vital',
      category: 'performance',
      data: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType
      }
    })
  }

  recordApiResponse(metric: ApiResponseTimeMetric): void {
    this.apiResponseTimes.push(metric)

    if (this.apiResponseTimes.length > this.maxApiMetrics) {
      this.apiResponseTimes = this.apiResponseTimes.slice(-this.maxApiMetrics)
    }

    telemetryCollector.record({
      type: 'api-response-time',
      category: 'performance',
      data: {
        endpoint: metric.endpoint,
        method: metric.method,
        duration: metric.duration,
        statusCode: metric.statusCode,
        cacheHit: metric.cacheHit,
        retryCount: metric.retryCount
      }
    })
  }

  recordResourceUtilization(metric: ResourceUtilizationMetric): void {
    this.resourceMetrics.push(metric)

    if (this.resourceMetrics.length > this.maxResourceMetrics) {
      this.resourceMetrics = this.resourceMetrics.slice(-this.maxResourceMetrics)
    }

    telemetryCollector.record({
      type: 'resource-utilization',
      category: 'performance',
      data: {
        cpuUsagePercent: metric.cpuUsagePercent,
        memoryUsageMB: metric.memoryUsageMB,
        memoryUsagePercent: metric.memoryUsagePercent,
        heapUsedMB: metric.heapUsedMB,
        heapTotalMB: metric.heapTotalMB,
        heapPercent: metric.heapPercent
      }
    })
  }

  recordError(endpoint: string, method: string, errorType: string): void {
    const key = `${method}:${endpoint}:${errorType}`
    const existing = this.errorRates.get(key)

    if (existing) {
      existing.count++
      existing.totalRequests++
      existing.rate = existing.count / existing.totalRequests
      this.errorRates.set(key, existing)
    } else {
      this.errorRates.set(key, {
        endpoint,
        method,
        errorType,
        count: 1,
        totalRequests: 1,
        rate: 1
      })
    }

    const metric = this.errorRates.get(key)!
    telemetryCollector.record({
      type: 'error-rate',
      category: 'performance',
      data: {
        endpoint: metric.endpoint,
        method: metric.method,
        errorType: metric.errorType,
        count: metric.count,
        totalRequests: metric.totalRequests,
        rate: metric.rate
      }
    })
  }

  recordSuccess(endpoint: string, method: string): void {
    for (const [key, metric] of this.errorRates) {
      if (metric.endpoint === endpoint && metric.method === method) {
        metric.totalRequests++
        metric.rate = metric.count / metric.totalRequests
        this.errorRates.set(key, metric)
      }
    }
  }

  getApiResponseMetrics(): {
    total: number
    p50: number
    p95: number
    p99: number
    avg: number
    min: number
    max: number
    byEndpoint: Record<string, { count: number; p50: number; p95: number; p99: number; avg: number }>
  } {
    if (this.apiResponseTimes.length === 0) {
      return {
        total: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        min: 0,
        max: 0,
        byEndpoint: {}
      }
    }

    const durations = this.apiResponseTimes.map(m => m.duration).sort((a, b) => a - b)
    const n = durations.length

    const p50Index = Math.floor(n * 0.5)
    const p95Index = Math.floor(n * 0.95)
    const p99Index = Math.floor(n * 0.99)

    const avg = durations.reduce((sum, d) => sum + d, 0) / n

    const byEndpoint: Record<string, { count: number; p50: number; p95: number; p99: number; avg: number }> = {}
    const endpointMap: Record<string, number[]> = {}

    for (const metric of this.apiResponseTimes) {
      const key = `${metric.method}:${metric.endpoint}`
      if (!endpointMap[key]) {
        endpointMap[key] = []
      }
      endpointMap[key].push(metric.duration)
    }

    for (const [key, durations] of Object.entries(endpointMap)) {
      const sorted = durations.sort((a, b) => a - b)
      const count = sorted.length
      byEndpoint[key] = {
        count,
        p50: sorted[Math.floor(count * 0.5)],
        p95: sorted[Math.floor(count * 0.95)],
        p99: sorted[Math.floor(count * 0.99)],
        avg: sorted.reduce((sum, d) => sum + d, 0) / count
      }
    }

    return {
      total: n,
      p50: durations[p50Index],
      p95: durations[p95Index],
      p99: durations[p99Index],
      avg,
      min: durations[0],
      max: durations[n - 1],
      byEndpoint
    }
  }

  getResourceMetrics(): {
    latest: ResourceUtilizationMetric | null
    avgCpuUsage: number
    avgMemoryUsage: number
    avgHeapUsage: number
  } {
    if (this.resourceMetrics.length === 0) {
      return {
        latest: null,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgHeapUsage: 0
      }
    }

    const avgCpuUsage = this.resourceMetrics.reduce((sum, m) => sum + m.cpuUsagePercent, 0) / this.resourceMetrics.length
    const avgMemoryUsage = this.resourceMetrics.reduce((sum, m) => sum + m.memoryUsagePercent, 0) / this.resourceMetrics.length
    const avgHeapUsage = this.resourceMetrics.reduce((sum, m) => sum + m.heapPercent, 0) / this.resourceMetrics.length

    return {
      latest: this.resourceMetrics[this.resourceMetrics.length - 1],
      avgCpuUsage,
      avgMemoryUsage,
      avgHeapUsage
    }
  }

  getErrorMetrics(): ErrorRateMetric[] {
    return Array.from(this.errorRates.values())
  }

  getWebVitalsMetrics(): {
    events: WebVitalsMetric[]
    byMetricName: Record<string, { count: number; avg: number; min: number; max: number }>
  } {
    const events = telemetryCollector.getEventsByType('web-vital')
    const webVitalsEvents = events.map(e => ({
      name: e.data.name as WebVitalsMetric['name'],
      value: e.data.value as number,
      rating: e.data.rating as 'good' | 'needs-improvement' | 'poor',
      id: e.data.id as string,
      navigationType: e.data.navigationType as string | undefined
    }))

    const byMetricName: Record<string, { count: number; avg: number; min: number; max: number }> = {}
    const metricMap: Record<string, number[]> = {}

    for (const event of webVitalsEvents) {
      if (!metricMap[event.name]) {
        metricMap[event.name] = []
      }
      metricMap[event.name].push(event.value)
    }

    for (const [name, values] of Object.entries(metricMap)) {
      const sorted = values.sort((a, b) => a - b)
      byMetricName[name] = {
        count: sorted.length,
        avg: sorted.reduce((sum, v) => sum + v, 0) / sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1]
      }
    }

    return {
      events: webVitalsEvents,
      byMetricName
    }
  }

  clear(): void {
    this.apiResponseTimes = []
    this.resourceMetrics = []
    this.errorRates.clear()
  }
}

export const performanceMetricsCollector = new PerformanceMetricsCollector()

export function captureCurrentResourceUtilization(): ResourceUtilizationMetric {
  const usage = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory

  return {
    cpuUsagePercent: 0,
    memoryUsageMB: Math.round(usedMemory / 1024 / 1024),
    memoryUsagePercent: Math.round((usedMemory / totalMemory) * 100),
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
    heapPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
  }
}

export function startResourceMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(() => {
    const metric = captureCurrentResourceUtilization()
    performanceMetricsCollector.recordResourceUtilization(metric)
  }, intervalMs)
}

export function calculatePercentiles(values: number[], p50: boolean = true, p95: boolean = true, p99: boolean = true): {
  p50?: number
  p95?: number
  p99?: number
} {
  if (values.length === 0) {
    return {}
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const result: { p50?: number; p95?: number; p99?: number } = {}

  if (p50) {
    result.p50 = sorted[Math.floor(n * 0.5)]
  }

  if (p95) {
    result.p95 = sorted[Math.floor(n * 0.95)]
  }

  if (p99) {
    result.p99 = sorted[Math.floor(n * 0.99)]
  }

  return result
}
