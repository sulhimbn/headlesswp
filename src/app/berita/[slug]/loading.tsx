import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PostDetailSkeleton />
      <Footer />
    </div>
  )
}
