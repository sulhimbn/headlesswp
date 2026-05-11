'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getBookmarks, clearAllBookmarks } from '@/lib/services/bookmarkService'
import type { BookmarkItem } from '@/lib/services/bookmarkService'
import Icon from '@/components/ui/Icon'
import SectionHeading from '@/components/ui/SectionHeading'
import { UI_TEXT } from '@/lib/constants/uiText'

const Header = dynamic(() => import('@/components/layout/Header'), { ssr: false })
const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setBookmarks(getBookmarks())
    setIsLoading(false)
  }, [])

  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua bookmark?')) {
      clearAllBookmarks()
      setBookmarks([])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[hsl(var(--color-secondary-dark))] rounded w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-lg)]" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          {UI_TEXT.bookmarkPage.heading}
        </h1>
        <div className="flex items-center justify-between mb-6">
          <SectionHeading id="bookmark-heading" level="h2" className="mb-0">
            {UI_TEXT.bookmarkPage.heading}
          </SectionHeading>
          {bookmarks.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-error))] transition-colors duration-[var(--transition-fast)]"
            >
              {UI_TEXT.bookmarkPage.clearAll}
            </button>
          )}
        </div>

        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <article
                key={bookmark.postId}
                className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-[var(--transition-normal)]"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    <Link
                      href={`/berita/${bookmark.slug}`}
                      className="text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
                    >
                      {bookmark.title}
                    </Link>
                  </h3>
                  <div className="text-xs sm:text-sm text-[hsl(var(--color-text-muted))]">
                    <time dateTime={new Date(bookmark.bookmarkedAt).toISOString()}>
                      {new Date(bookmark.bookmarkedAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon type="bookmark" className="h-16 w-16 mx-auto text-[hsl(var(--color-text-muted))] mb-4" />
            <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-2">
              {UI_TEXT.bookmarkPage.emptyTitle}
            </h2>
            <p className="text-[hsl(var(--color-text-secondary))] mb-6">
              {UI_TEXT.bookmarkPage.emptyDescription}
            </p>
            <Link
              href="/berita"
              className="inline-flex items-center px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-primary-dark))] transition-colors duration-[var(--transition-fast)]"
            >
              {UI_TEXT.bookmarkPage.browseNews}
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}