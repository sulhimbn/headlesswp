'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getReadingHistory } from '@/lib/utils/readingHistory'

interface CategoryPreference {
  categoryId: number
  count: number
  percentage: number
}

interface TagPreference {
  tagId: number
  count: number
  percentage: number
}

interface ReadingPattern {
  topCategories: CategoryPreference[]
  topTags: TagPreference[]
  totalArticles: number
  averagePerDay: number
  lastReadTimestamp: number
}

interface UseReadingHistoryReturn {
  patterns: ReadingPattern | null
  recentSlugs: string[]
  isLoading: boolean
  refreshPatterns: () => void
}

const PREFETCH_ANALYSIS_KEY = 'prefetch_analysis'

function calculatePreferences(prefs: Map<number, number>, limit: number): Array<{ id: number; count: number; percentage: number }> {
  const total = Array.from(prefs.values()).reduce((sum, count) => sum + count, 0)
  if (total === 0) return []

  return Array.from(prefs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({
      id,
      count,
      percentage: Math.round((count / total) * 100),
    }))
}

function getAverageReadPerDay(history: { items: Array<{ timestamp: number }> }): number {
  if (history.items.length === 0) return 0

  const timestamps = history.items.map(item => item.timestamp)
  const oldest = Math.min(...timestamps)
  const newest = Math.max(...timestamps)
  const daysDiff = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24))

  return Math.round(history.items.length / daysDiff * 10) / 10
}

export function useReadingHistory(enabled = true): UseReadingHistoryReturn {
  const [patterns, setPatterns] = useState<ReadingPattern | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const analyzePatterns = useCallback(() => {
    if (typeof window === 'undefined') return

    const history = getReadingHistory()

    if (history.items.length === 0) {
      setPatterns(null)
      setIsLoading(false)
      return
    }

    const topCats = calculatePreferences(
      history.categoryPreferences,
      5
    ).map(c => ({
      categoryId: c.id,
      count: c.count,
      percentage: c.percentage,
    }))

    const topTags = calculatePreferences(
      history.tagPreferences,
      10
    ).map(t => ({
      tagId: t.id,
      count: t.count,
      percentage: t.percentage,
    }))

    const avgPerDay = getAverageReadPerDay(history)

    const analysis: ReadingPattern = {
      topCategories: topCats,
      topTags: topTags,
      totalArticles: history.items.length,
      averagePerDay: avgPerDay,
      lastReadTimestamp: history.items[0]?.timestamp || 0,
    }

    setPatterns(analysis)

    try {
      localStorage.setItem(PREFETCH_ANALYSIS_KEY, JSON.stringify({
        patterns: analysis,
        lastUpdated: Date.now(),
      }))
    } catch {
      // Storage unavailable
    }
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    analyzePatterns()
    setIsLoading(false)
  }, [enabled, analyzePatterns])

  const recentSlugs = useMemo(() => {
    if (!patterns) return []
    const history = getReadingHistory()
    return history.items.slice(0, 10).map(item => item.slug)
  }, [patterns])

  return {
    patterns,
    recentSlugs,
    isLoading,
    refreshPatterns: analyzePatterns,
  }
}