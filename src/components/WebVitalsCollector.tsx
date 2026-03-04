'use client'

import { useWebVitals } from '@/lib/utils/webVitals'

export default function WebVitalsCollector() {
  useWebVitals({
    reportToApi: true,
    reportToAnalytics: undefined
  })
  
  return null
}
