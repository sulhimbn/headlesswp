'use client'

import { useEffect } from 'react'

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and in the browser
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return
    }

    // Track Core Web Vitals
    const trackWebVitals = async () => {
      try {
        // Import web-vitals library dynamically
        const webVitals = await import('web-vitals')
        
        const sendToAnalytics = (metric: any) => {
          // Send to analytics service (Google Analytics, custom endpoint, etc.)
          console.log('Web Vital:', metric.name, metric.value)
          
          // Example: Send to Google Analytics 4
          if (typeof (window as any).gtag !== 'undefined') {
            (window as any).gtag('event', metric.name, {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              non_interaction: true,
            })
          }
          
          // Example: Send to custom analytics endpoint
          if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
            fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                metric: metric.name,
                value: metric.value,
                id: metric.id,
                url: window.location.href,
                timestamp: new Date().toISOString(),
              }),
            }).catch(() => {
              // Silently fail analytics requests
            })
          }
        }

        // Track all Core Web Vitals
        if (webVitals.onCLS) webVitals.onCLS(sendToAnalytics);
        if (webVitals.onINP) webVitals.onINP(sendToAnalytics); // onINP replaces onFID in newer versions
        if (webVitals.onFCP) webVitals.onFCP(sendToAnalytics);
        if (webVitals.onLCP) webVitals.onLCP(sendToAnalytics);
        if (webVitals.onTTFB) webVitals.onTTFB(sendToAnalytics);
        
      } catch (error) {
        console.warn('Failed to load web-vitals:', error)
      }
    }

    // Delay tracking to avoid affecting initial page load
    const timer = setTimeout(trackWebVitals, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Track page load performance
  useEffect(() => {
    if (typeof window === 'undefined') return

    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const metrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: 0,
          firstContentfulPaint: 0,
        }

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint')
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime
          }
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime
          }
        })

        console.log('Page Load Metrics:', metrics)
      }
    }

    if (document.readyState === 'complete') {
      trackPageLoad()
    } else {
      window.addEventListener('load', trackPageLoad)
      return () => window.removeEventListener('load', trackPageLoad)
    }
  }, [])

  return null
}