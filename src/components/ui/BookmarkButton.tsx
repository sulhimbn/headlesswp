'use client'

import { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/ui/Icon'
import { toggleBookmark, isBookmarked } from '@/lib/utils/bookmarks'

interface BookmarkButtonProps {
  postId: number
  slug: string
  title: string
  thumbnail?: string | null
  category?: string | null
  className?: string
}

export default function BookmarkButton({
  postId,
  slug,
  title,
  thumbnail = null,
  category = null,
  className = ''
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setBookmarked(isBookmarked(postId))
    setIsLoading(false)
  }, [postId])

  const handleToggle = useCallback(() => {
    const newState = toggleBookmark(postId, slug, title, thumbnail, category)
    setBookmarked(newState)
  }, [postId, slug, title, thumbnail, category])

  if (isLoading) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] text-[hsl(var(--color-text-muted))] bg-[hsl(var(--color-secondary))] ${className}`}
        disabled
        aria-hidden="true"
      >
        <Icon type="bookmarkOutline" className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 ${
        bookmarked
          ? 'text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))] bg-[hsl(var(--color-primary-light))]'
          : 'text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-primary))] bg-[hsl(var(--color-secondary))] hover:bg-[hsl(var(--color-secondary-dark))]'
      } ${className}`}
      onClick={handleToggle}
      aria-label={bookmarked ? 'Hapus dari markah' : 'Simpan ke markah'}
      aria-pressed={bookmarked}
    >
      <Icon type={bookmarked ? 'bookmark' : 'bookmarkOutline'} className="h-5 w-5" />
    </button>
  )
}