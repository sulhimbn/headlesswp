'use client'

import { useState, useEffect, useCallback } from 'react'
import { addBookmark, removeBookmark, isBookmarked } from '@/lib/services/bookmarkService'
import Icon from '@/components/ui/Icon'

interface BookmarkButtonProps {
  postId: number
  slug: string
  title: { rendered: string }
  featured_media: number
  categories: number[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function BookmarkButton({
  postId,
  slug,
  title,
  featured_media,
  categories,
  size = 'md',
  className = ''
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setBookmarked(isBookmarked(postId))
    setIsLoading(false)
  }, [postId])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (bookmarked) {
      removeBookmark(postId)
      setBookmarked(false)
    } else {
      addBookmark({
        id: postId,
        slug,
        title,
        featured_media,
        categories,
      })
      setBookmarked(true)
    }
  }, [bookmarked, postId, slug, title, featured_media, categories])

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (isLoading) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-secondary-dark))] ${sizeClasses[size]} ${className}`}
        disabled
        aria-hidden="true"
      >
        <div className={`${iconSizes[size]} animate-pulse bg-[hsl(var(--color-text-muted))] rounded`} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 ${
        bookmarked
          ? 'text-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary-light))]/20 hover:bg-[hsl(var(--color-primary-light))]/30'
          : 'text-[hsl(var(--color-text-secondary))] bg-[hsl(var(--color-surface))]/80 hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))]'
      } ${sizeClasses[size]} ${className}`}
      aria-label={bookmarked ? 'Hapus dari bookmark' : 'Tambah ke bookmark'}
      aria-pressed={bookmarked}
    >
      <Icon type={bookmarked ? 'bookmarkFilled' : 'bookmark'} className={iconSizes[size]} />
    </button>
  )
}