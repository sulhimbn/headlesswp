import PostCardSkeleton from '@/components/post/PostCardSkeleton'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Skeleton from '@/components/ui/Skeleton'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="status" aria-live="polite" aria-label={UI_TEXT.loading.article}>
        <div className="bg-[hsl(var(--color-secondary))] rounded-[var(--radius-lg)] p-6 mb-8" aria-busy="true">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-24 w-24" />
            <div className="flex-1">
              <Skeleton variant="text" className="h-8 w-48 mb-2" />
              <Skeleton variant="text" className="h-4 w-80 mb-1" />
              <Skeleton variant="text" className="h-4 w-64" />
            </div>
          </div>
        </div>

        <Skeleton variant="text" className="h-8 w-64 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}