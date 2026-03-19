'use client'

import { useEffect, useRef, useCallback } from 'react'
import { readingPatternTracker } from '@/lib/services/readingPatternTracker'
import { popularityScorer } from '@/lib/services/popularityScorer'
import { FEATURE_FLAGS } from '@/lib/api/config'

const PREFETCH_STORAGE_KEY = 'prefetch_metrics'

export interface PrefetchMetrics {
  prefetchedCount: number
  usedCount: number
  accuracy: number
}

interface StoredMetrics {
  prefetched: number[]
  used: number[]
}

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export interface UsePredictivePrefetchOptions {
  postId: number
  categoryIds: number[]
  tagIds?: number[]
  enabled?: boolean
  prefetchLimit?: number
  onPrefetch?: (urls: string[]) => void
}

export function usePredictivePrefetch({
  postId,
  categoryIds,
  tagIds = [],
  enabled = true,
  prefetchLimit = 5,
  onPrefetch,
}: UsePredictivePrefetchOptions): {
  prefetch: () => void
  recordUsage: (postId: number) => void
  getMetrics: () => PrefetchMetrics
  predictedPostIds: number[]
} {
  const predictedPostIdsRef = useRef<number[]>([])
  const enabledRef = useRef(enabled)

  enabledRef.current = enabled && FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS

  const prefetch = useCallback(() => {
    if (!enabledRef.current || typeof window === 'undefined') return

    readingPatternTracker.trackRead(postId, categoryIds, tagIds)
    popularityScorer.recordView(postId, categoryIds)

    const predicted = popularityScorer.predictNextPosts(postId, categoryIds, prefetchLimit)
    predictedPostIdsRef.current = predicted

    const urls = predicted.map(id => `/posts/${id}`)
    
    if (onPrefetch) {
      onPrefetch(urls)
    }

    const stored = getStorageItem<StoredMetrics>(PREFETCH_STORAGE_KEY, {
      prefetched: [],
      used: [],
    })

    setStorageItem(PREFETCH_STORAGE_KEY, {
      prefetched: [...stored.prefetched, ...predicted.slice(0, 3)],
      used: stored.used,
    })

    urls.forEach(url => {
      if (typeof window !== 'undefined') {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = url
        link.as = 'document'
        document.head.appendChild(link)
      }
    })
  }, [postId, categoryIds, tagIds, prefetchLimit, onPrefetch])

  const recordUsage = useCallback((usedPostId: number) => {
    if (typeof window === 'undefined') return

    const stored = getStorageItem<StoredMetrics>(PREFETCH_STORAGE_KEY, {
      prefetched: [],
      used: [],
    })

    setStorageItem(PREFETCH_STORAGE_KEY, {
      prefetched: stored.prefetched,
      used: [...stored.used, usedPostId],
    })
  }, [])

  const getMetrics = useCallback((): PrefetchMetrics => {
    const stored = getStorageItem<StoredMetrics>(PREFETCH_STORAGE_KEY, {
      prefetched: [],
      used: [],
    })

    const prefetchedSet = new Set(stored.prefetched)
    const usedSet = new Set(stored.used)
    
    let usedCount = 0
    for (const prefetched of prefetchedSet) {
      if (usedSet.has(prefetched)) {
        usedCount++
      }
    }

    const prefetchedCount = prefetchedSet.size
    const accuracy = prefetchedCount > 0 ? usedCount / prefetchedCount : 0

    return {
      prefetchedCount,
      usedCount,
      accuracy: Math.round(accuracy * 100) / 100,
    }
  }, [])

  useEffect(() => {
    if (!enabledRef.current) return

    const timer = setTimeout(() => {
      prefetch()
    }, 2000)

    return () => clearTimeout(timer)
  }, [prefetch])

  return {
    prefetch,
    recordUsage,
    getMetrics,
    predictedPostIds: predictedPostIdsRef.current,
  }
}

export function clearPrefetchMetrics(): void {
  setStorageItem(PREFETCH_STORAGE_KEY, {
    prefetched: [],
    used: [],
  })
}
