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

interface UseWebVitalsOptions {
  reportToAnalytics?: (metric: WebVitalsReport) => void
  reportToApi?: boolean
  apiEndpoint?: string
}

export function useWebVitals(options: UseWebVitalsOptions = {}) {
  const {
    reportToAnalytics,
    reportToApi = true,
    apiEndpoint = '/api/observability/performance'
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
  }, [reportToAnalytics, reportToApi, apiEndpoint])
}

export default useWebVitals
