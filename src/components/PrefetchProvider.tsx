'use client'

import { type ReactNode, useEffect } from 'react'
import { usePredictivePrefetch } from '@/lib/hooks/usePredictivePrefetch'

interface PrefetchProviderProps {
  children: ReactNode
}

export default function PrefetchProvider({ children }: PrefetchProviderProps) {
  const { getPredictions, prefetchPage, model } = usePredictivePrefetch()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleHoverOrPause = () => {
      const predictions = getPredictions(window.location.pathname)
      
      predictions.forEach(prediction => {
        if (prediction.confidence >= 0.7) {
          prefetchPage(prediction.path)
        }
      })
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const random = Math.random()
        if (random < 0.1) {
          handleHoverOrPause()
        }
      }
    }, 5000)

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        handleHoverOrPause()
      }
    }

    document.addEventListener('visibilitychange', visibilityHandler)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [getPredictions, prefetchPage, model])

  return <>{children}</>
}

export { usePredictivePrefetch } from '@/lib/hooks/usePredictivePrefetch'