'use client'

import React, { useEffect } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import { reportWebVitals, performanceUtils } from '@/lib/performance'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    // Report Web Vitals
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals);
        onINP(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
      });

      // Measure page load performance
      const measurePerformance = () => {
        const metrics = performanceUtils.measurePageLoad();
        if (metrics) {
          console.log('Page Performance Metrics:', metrics);
        }
      };

      // Measure after page load
      if (document.readyState === 'complete') {
        measurePerformance();
      } else {
        window.addEventListener('load', measurePerformance);
        return () => window.removeEventListener('load', measurePerformance);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}