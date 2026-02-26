'use client'

import { useReadingTracker } from '@/components/hooks/useReadingTracker'

interface ReadingTrackerProps {
  postId: number
  slug: string
  title: string
  categoryIds: number[]
  tagIds: number[]
}

export default function ReadingTracker({ postId, slug, title, categoryIds, tagIds }: ReadingTrackerProps) {
  useReadingTracker({
    postId,
    slug,
    title,
    categoryIds,
    tagIds,
    enabled: true,
  })

  return null
}
