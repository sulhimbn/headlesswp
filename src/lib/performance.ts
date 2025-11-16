import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    })
  }

  // Send to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric)
  }

  // Store for performance monitoring
  if (typeof window !== 'undefined') {
    window.performanceMetrics = window.performanceMetrics || []
    window.performanceMetrics.push({
      ...metric,
      timestamp: Date.now(),
    })
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}

// Performance monitoring utilities
export const measurePageLoad = () => {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  
  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
    firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
    timeToFirstByte: navigation.responseStart - navigation.requestStart,
  }
}

export const measureApiCall = async <T>(apiCall: () => Promise<T>, endpoint: string): Promise<T> => {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const endTime = performance.now()
    const duration = endTime - startTime

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Performance] ${endpoint}: ${duration.toFixed(2)}ms`)
    }

    // Store for monitoring
    if (typeof window !== 'undefined') {
      window.apiMetrics = window.apiMetrics || []
      window.apiMetrics.push({
        endpoint,
        duration,
        timestamp: Date.now(),
        success: true,
      })
    }

    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    // Store failed call for monitoring
    if (typeof window !== 'undefined') {
      window.apiMetrics = window.apiMetrics || []
      window.apiMetrics.push({
        endpoint,
        duration,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    throw error
  }
}

// Type declarations for global window object
declare global {
  interface Window {
    performanceMetrics?: Array<{
      name: string
      value: number
      id: string
      timestamp: number
    }>
    apiMetrics?: Array<{
      endpoint: string
      duration: number
      timestamp: number
      success: boolean
      error?: string
    }>
    gtag?: (...args: any[]) => void
  }
}