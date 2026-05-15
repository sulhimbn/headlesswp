'use client'

import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch'

interface PredictivePrefetchProps {
  postId: number
  categoryIds: number[]
  tagIds: number[]
  enabled?: boolean
}

export default function PredictivePrefetch({
  postId,
  categoryIds,
  tagIds,
  enabled = true,
}: PredictivePrefetchProps) {
  usePredictivePrefetch({
    currentPostId: postId,
    currentCategoryIds: categoryIds,
    currentTagIds: tagIds,
    enabled,
  })

  return null
}