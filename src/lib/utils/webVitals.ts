'use client'

import { useEffect } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

export interface WebVitalsReport {
  name: 'FCP' | 'LCP' | 'TTFB' | 'CLS' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType?: string
}

export interface AlertThresholds {
  lcp: { good: number; poor: number }
  fid: { good: number; poor: number }
  cls: { good: number; poor: number }
  inp: { good: number; poor: number }
  fcp: { good: number; poor: number }
  ttfb: { good: number; poor: number }
}

export const ALERT_THRESHOLDS: AlertThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
}

export function getAlertForMetric(metric: WebVitalsReport): string | null {
  const threshold = ALERT_THRESHOLDS[metric.name.toLowerCase() as keyof AlertThresholds]
  if (!threshold) return null
  
  if (metric.value > threshold.poor) {
    return `CRITICAL: ${metric.name} is ${metric.value}ms (threshold: ${threshold.poor}ms)`
  } else if (metric.value > threshold.good) {
    return `WARNING: ${metric.name} is ${metric.value}ms (threshold: ${threshold.good}ms)`
  }
  
  return null
}

interface UseWebVitalsOptions {
  reportToAnalytics?: (metric: WebVitalsReport) => void
  reportToApi?: boolean
  apiEndpoint?: string
  enableAlerts?: boolean
}

export function useWebVitals(options: UseWebVitalsOptions = {}) {
  const {
    reportToAnalytics,
    reportToApi = true,
    apiEndpoint = '/api/observability/vitals',
    enableAlerts = false
  } = options

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reportMetric = (metric: {
      name: string
      value: number
      rating: 'good' | 'needs-improvement' | 'poor'
      id: string
      navigationType?: string
    }) => {
      const report: WebVitalsReport = {
        name: metric.name as WebVitalsReport['name'],
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType
      }

      reportToAnalytics?.(report)

      if (enableAlerts) {
        const alert = getAlertForMetric(report)
        if (alert) {
          console.warn(`[WebVitals Alert] ${alert}`)
        }
      }

      if (reportToApi) {
        fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'web-vital',
            category: 'performance',
            data: report
          }),
          keepalive: true
        }).catch((error) => {
          console.error('Failed to report web vital:', error)
        })
      }
    }

    onCLS(reportMetric)
    onFCP(reportMetric)
    onINP(reportMetric)
    onLCP(reportMetric)
    onTTFB(reportMetric)
  }, [reportToAnalytics, reportToApi, apiEndpoint, enableAlerts])
}

export default useWebVitals
