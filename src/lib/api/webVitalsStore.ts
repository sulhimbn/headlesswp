export interface WebVitalsReport {
  name: 'FCP' | 'LCP' | 'TTFB' | 'CLS' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
  timestamp?: string
}

interface WebVitalsData {
  values: number[]
  ratings: { good: number; 'needs-improvement': number; poor: number }
}

export class WebVitalsStore {
  private vitals: Map<string, WebVitalsData> = new Map()
  private maxEvents = 1000

  constructor() {
    this.initMetrics()
  }

  private initMetrics(): void {
    const metrics: WebVitalsReport['name'][] = ['FCP', 'LCP', 'TTFB', 'CLS', 'INP']
    for (const metric of metrics) {
      this.vitals.set(metric, { values: [], ratings: { good: 0, 'needs-improvement': 0, poor: 0 } })
    }
  }

  record(metric: WebVitalsReport): void {
    const data = this.vitals.get(metric.name)
    if (!data) return

    data.values.push(metric.value)
    data.ratings[metric.rating]++

    if (data.values.length > this.maxEvents) {
      const overflow = data.values.length - this.maxEvents
      data.values = data.values.slice(overflow)
    }
  }

  getAggregatedMetrics(): Record<string, {
    count: number
    p75: number
    p90: number
    p99: number
    avg: number
    min: number
    max: number
    ratings: { good: number; 'needs-improvement': number; poor: number }
  }> {
    const result: Record<string, {
      count: number
      p75: number
      p90: number
      p99: number
      avg: number
      min: number
      max: number
      ratings: { good: number; 'needs-improvement': number; poor: number }
    }> = {}

    for (const [name, data] of this.vitals) {
      if (data.values.length === 0) {
        result[name] = {
          count: 0,
          p75: 0,
          p90: 0,
          p99: 0,
          avg: 0,
          min: 0,
          max: 0,
          ratings: { ...data.ratings }
        }
        continue
      }

      const sorted = [...data.values].sort((a, b) => a - b)
      const n = sorted.length

      result[name] = {
        count: n,
        p75: sorted[Math.floor(n * 0.75)],
        p90: sorted[Math.floor(n * 0.90)],
        p99: sorted[Math.floor(n * 0.99)],
        avg: Math.round(sorted.reduce((sum, v) => sum + v, 0) / n),
        min: sorted[0],
        max: sorted[n - 1],
        ratings: { ...data.ratings }
      }
    }

    return result
  }

  clear(): void {
    this.initMetrics()
  }
}

export const webVitalsStore = new WebVitalsStore()