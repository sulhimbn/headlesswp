import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCardSkeleton from '@/components/post/PostCardSkeleton'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <div role="status" aria-live="polite" aria-label={UI_TEXT.loading.news}>
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2 w-48" />
          <div className="h-5 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
