import { enhancedPostService } from '@/lib/services/enhancedPostService'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import { PAGINATION_LIMITS } from '@/lib/api/config'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => null,
  ssr: true
})

export const revalidate = 300

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const postsPerPage = PAGINATION_LIMITS.ALL_POSTS

  const { posts, totalPages } = await enhancedPostService.getPaginatedPosts(page, postsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeading level="h1" className="mb-2">
          Semua Berita
        </SectionHeading>
        <p className="text-gray-600 mb-8">Kumpulan berita terkini dari Mitra Banten News</p>

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath="/berita" />
            )}
          </>
        ) : (
          <EmptyState
            title="Tidak ada berita"
            description="Belum ada berita untuk ditampilkan saat ini."
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
