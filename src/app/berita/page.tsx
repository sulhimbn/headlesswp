import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import { PAGINATION_LIMITS } from '@/lib/api/config'

export const revalidate = 300

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const postsPerPage = PAGINATION_LIMITS.ALL_POSTS

  const { posts, totalPosts } = await enhancedPostService.getPaginatedPosts(page, postsPerPage)
  const totalPages = Math.ceil(totalPosts / postsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Semua Berita</h1>
          <p className="text-gray-600 mt-2">Kumpulan berita terkini dari Mitra Banten News</p>
        </div>

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath="/berita" />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Tidak ada berita untuk ditampilkan.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
