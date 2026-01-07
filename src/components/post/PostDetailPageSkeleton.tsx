import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default function PostDetailPageSkeleton() {
  const breadcrumbItems = [
    { label: 'Berita', href: '/berita' },
    { label: 'Memuat...', href: '#' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Memuat konten">
        <Breadcrumb items={breadcrumbItems} />
        <PostDetailSkeleton />
      </main>
      <Footer />
    </div>
  )
}
