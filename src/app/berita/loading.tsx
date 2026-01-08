import PostCardSkeleton from '@/components/post/PostCardSkeleton'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="status" aria-live="polite" aria-label="Memuat berita">
        <div className="mb-8" aria-busy="true">
          <Skeleton variant="text" className="h-12 mb-2 w-64" />
          <Skeleton variant="text" className="h-5 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
