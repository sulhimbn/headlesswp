'use client'

import { useWebVitals } from '@/lib/utils/webVitals'

export default function WebVitalsReporter() {
  useWebVitals({
    reportToApi: true,
    apiEndpoint: '/api/observability/performance'
  })
  
  return null
}
