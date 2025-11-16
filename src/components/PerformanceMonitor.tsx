'use client'

import { useEffect } from 'react'
import { reportWebVitals, measurePageLoad } from '@/lib/performance'
import { captureError } from '@/lib/sentry'

export function PerformanceMonitor() {
  useEffect(() => {
    // Report Web Vitals
    reportWebVitals()

    // Measure page load performance
    const measurePerformance = () => {
      try {
        const metrics = measurePageLoad()
        
        // Log slow page loads
        if (metrics && metrics.loadComplete > 3000) {
          captureError('Slow page load detected', {
            tags: { type: 'performance' },
            extra: { metrics },
          })
        }
      } catch (error) {
        captureError('Performance monitoring failed', {
          tags: { type: 'performance' },
          extra: { error: error instanceof Error ? error.message : 'Unknown error' },
        })
      }
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }
  }, [])

  // Monitor API calls
  useEffect(() => {
    // Override fetch to monitor API calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const [url, options] = args

      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const duration = endTime - startTime

        // Log slow API calls
        if (duration > 5000) {
          captureError('Slow API call detected', {
            tags: { type: 'performance' },
            extra: { url: typeof url === 'string' ? url : 'multiple-urls', duration },
          })
        }

        return response
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        captureError('API call failed', {
          tags: { type: 'api' },
          extra: { 
            url: typeof url === 'string' ? url : 'multiple-urls', 
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}