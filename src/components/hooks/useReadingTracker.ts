'use client'

import { useEffect } from 'react'
import { addToReadingHistory } from '@/lib/utils/readingHistory'

interface UseReadingTrackerProps {
  postId: number
  slug: string
  title: string
  categoryIds: number[]
  tagIds: number[]
  enabled?: boolean
}

export function useReadingTracker({
  postId,
  slug,
  title,
  categoryIds,
  tagIds,
  enabled = true,
}: UseReadingTrackerProps): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    addToReadingHistory(postId, slug, title, categoryIds, tagIds)
  }, [postId, slug, title, categoryIds.join(','), tagIds.join(','), enabled])
}
