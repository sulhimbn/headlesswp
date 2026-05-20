import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCardSkeleton from '@/components/post/PostCardSkeleton'
import SectionHeading from '@/components/ui/SectionHeading'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          Pencarian
        </h1>
        <SectionHeading id="search-results" className="mb-6">
          Pencarian
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
