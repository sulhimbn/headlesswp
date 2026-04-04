import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCardSkeleton from '@/components/post/PostCardSkeleton'
import SectionHeading from '@/components/ui/SectionHeading'
import Skeleton from '@/components/ui/Skeleton'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[hsl(var(--color-background-secondary))] rounded-lg p-6 mb-8">
          <div role="status" aria-live="polite" aria-label={UI_TEXT.loading.article}>
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" className="h-24 w-24" />
              <div>
                <Skeleton variant="text" className="h-8 w-48 mb-2" />
                <Skeleton variant="text" className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>

        <SectionHeading id="author-posts" level="h2" className="mb-6">
          Artikel
        </SectionHeading>

        <div role="status" aria-live="polite" aria-label={UI_TEXT.loading.news}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
