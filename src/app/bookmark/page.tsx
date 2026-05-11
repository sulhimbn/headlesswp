'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { getBookmarks, removeBookmark } from '@/lib/utils/bookmarks'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { BookmarkItem } from '@/lib/utils/bookmarks'

const Header = dynamic(() => import('@/components/layout/Header'), { ssr: false })
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false })

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setBookmarks(getBookmarks())
    setIsLoading(false)
  }, [])

  const handleRemove = (postId: number) => {
    removeBookmark(postId)
    setBookmarks(getBookmarks())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-md)] w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] h-64 animate-pulse" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--color-text-primary))] mb-2">
          {UI_TEXT.bookmark.pageTitle}
        </h1>
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <article
                key={bookmark.postId}
                className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-[var(--transition-normal)]"
              >
                {bookmark.thumbnail && (
                  <div className="relative h-48">
                    <img
                      src={bookmark.thumbnail}
                      alt={bookmark.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  {bookmark.category && (
                    <span className="text-xs text-[hsl(var(--color-primary))] font-medium">
                      {bookmark.category}
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-[hsl(var(--color-text-primary))] mt-1 line-clamp-2">
                    <a
                      href={`/berita/${bookmark.slug}`}
                      className="hover:text-[hsl(var(--color-primary))] transition-colors"
                    >
                      {bookmark.title}
                    </a>
                  </h2>
                  <div className="mt-4 flex justify-between items-center">
                    <time className="text-xs text-[hsl(var(--color-text-muted))]">
                      {new Date(bookmark.bookmarkedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </time>
                    <button
                      onClick={() => handleRemove(bookmark.postId)}
                      className="text-sm text-[hsl(var(--color-error))] hover:text-[hsl(var(--color-accent-dark))] transition-colors"
                      aria-label={UI_TEXT.bookmark.remove}
                    >
                      {UI_TEXT.bookmark.remove}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--color-secondary-dark))] mb-4">
              <svg
                className="w-8 h-8 text-[hsl(var(--color-text-muted))]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-2">
              {UI_TEXT.bookmark.emptyTitle}
            </h2>
            <p className="text-[hsl(var(--color-text-muted))]">
              {UI_TEXT.bookmark.emptyDescription}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}