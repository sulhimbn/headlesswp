export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

export function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);
  const url = '/api/performance';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
}

// Performance monitoring utilities
export const performanceUtils = {
  // Measure page load time
  measurePageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: window.performance.getEntriesByType('paint')[1]?.startTime || 0,
      };
    }
    return null;
  },

  // Measure API response time
  measureApiResponse: (startTime: number) => {
    return performance.now() - startTime;
  },

  // Get memory usage (if available)
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
    return null;
  },
};

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}