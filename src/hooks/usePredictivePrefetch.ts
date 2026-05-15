'use client'

import { useEffect, useCallback, useState } from 'react'
import { getTopCategories, getReadingHistory, hasReadPost } from '@/lib/utils/readingHistory'
import { FEATURE_FLAGS, PREFETCH_CONFIG } from '@/lib/api/config'

interface PrefetchMetrics {
  predictedCount: number
  hitCount: number
  missCount: number
  lastUpdated: number
}

interface UsePredictivePrefetchProps {
  currentPostId: number
  currentCategoryIds: number[]
  currentTagIds?: number[]
  enabled?: boolean
}

interface UsePredictivePrefetchReturn {
  isPrefetching: boolean
  predictedPostIds: number[]
  metrics: PrefetchMetrics | null
}

const PREFETCH_METRICS_KEY = 'prefetch_metrics'
const PREFETCHED_ROUTES_KEY = 'prefetched_routes'

function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable
  }
}

function updateMetrics(hit: boolean): void {
  const current = getLocalStorage<PrefetchMetrics>(PREFETCH_METRICS_KEY, {
    predictedCount: 0,
    hitCount: 0,
    missCount: 0,
    lastUpdated: Date.now(),
  })

  const newMetrics: PrefetchMetrics = {
    ...current,
    predictedCount: current.predictedCount + 1,
    hitCount: hit ? current.hitCount + 1 : current.hitCount,
    missCount: hit ? current.missCount : current.missCount + 1,
    lastUpdated: Date.now(),
  }

  setLocalStorage(PREFETCH_METRICS_KEY, newMetrics)
}

function getPredictedCategories(currentCategories: number[]): number[] {
  const topCategories = getTopCategories(PREFETCH_CONFIG.MAX_PREFETCH_COUNT)
  const predicted = topCategories.filter(catId => !currentCategories.includes(catId))
  return predicted.slice(0, PREFETCH_CONFIG.MAX_PREFETCH_COUNT)
}

async function prefetchpredictedPosts(categoryIds: number[]): Promise<number[]> {
  if (categoryIds.length === 0) return []

  const history = getReadingHistory()
  const recentPosts = history.items.slice(0, 10)

  const candidateIds = new Set<number>()

  for (const post of recentPosts) {
    if (post.categoryIds.some(catId => categoryIds.includes(catId))) {
      if (!hasReadPost(post.postId)) {
        candidateIds.add(post.postId)
      }
    }
  }

  if (candidateIds.size < PREFETCH_CONFIG.MAX_PREFETCH_COUNT) {
    for (const post of recentPosts) {
      if (candidateIds.size >= PREFETCH_CONFIG.MAX_PREFETCH_COUNT) break
      if (!hasReadPost(post.postId)) {
        candidateIds.add(post.postId)
      }
    }
  }

  return Array.from(candidateIds).slice(0, PREFETCH_CONFIG.MAX_PREFETCH_COUNT)
}

function prefetchRoute(href: string): void {
  if (typeof window === 'undefined' || !window.fetch) return

  const prefetched = getLocalStorage<{ href: string; timestamp: number }[]>(PREFETCHED_ROUTES_KEY, [])
  const isAlreadyPrefetched = prefetched.some(
    p => p.href === href && Date.now() - p.timestamp < PREFETCH_CONFIG.PREFETCH_CACHE_DURATION
  )

  if (isAlreadyPrefetched) return

  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }

  prefetched.push({ href, timestamp: Date.now() })
  const trimmed = prefetched.slice(-20)
  setLocalStorage(PREFETCHED_ROUTES_KEY, trimmed)
}

export function usePredictivePrefetch({
  currentPostId,
  currentCategoryIds,
  currentTagIds: _currentTagIds,
  enabled = true,
}: UsePredictivePrefetchProps): UsePredictivePrefetchReturn {
  const [isPrefetching, setIsPrefetching] = useState(false)
  const [predictedPostIds, setPredictedPostIds] = useState<number[]>([])
  const [metrics, setMetrics] = useState<PrefetchMetrics | null>(null)

  const prefetchCallback = useCallback(async () => {
    if (!enabled || FEATURE_FLAGS.PREDICTIVE_PREFETCH === false) return

    const predictedCategories = getPredictedCategories(currentCategoryIds)

    if (predictedCategories.length === 0) {
      setPredictedPostIds([])
      return
    }

    try {
      const postIds = await prefetchpredictedPosts(predictedCategories)
      setPredictedPostIds(postIds)

      for (const postId of postIds) {
        prefetchRoute(`/berita/${postId}`)
      }

      updateMetrics(false)
    } catch {
      setPredictedPostIds([])
    }
  }, [enabled])

  useEffect(() => {
    const stored = getLocalStorage<PrefetchMetrics | null>(PREFETCH_METRICS_KEY, null)
    setMetrics(stored)
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const timer = setTimeout(() => {
      setIsPrefetching(true)
      prefetchCallback()
    }, PREFETCH_CONFIG.DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [enabled, prefetchCallback])

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      const scrollProgress = (scrollTop + clientHeight) / scrollHeight

      if (scrollProgress >= PREFETCH_CONFIG.READ_COMPLETION_THRESHOLD) {
        if (currentPostId && predictedPostIds.length > 0) {
          const history = getReadingHistory()
          const nextPost = history.items.find(
            item =>
              item.postId !== currentPostId &&
              item.categoryIds.some(catId => currentCategoryIds.includes(catId))
          )

          if (nextPost) {
            updateMetrics(true)
            prefetchRoute(`/berita/${nextPost.slug}`)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enabled, currentPostId, currentCategoryIds])

  return {
    isPrefetching,
    predictedPostIds,
    metrics,
  }
}