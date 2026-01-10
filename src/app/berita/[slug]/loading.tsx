import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <div role="status" aria-live="polite" aria-label="Memuat artikel">
        <PostDetailSkeleton />
      </div>
      <Footer />
    </div>
  )
}
