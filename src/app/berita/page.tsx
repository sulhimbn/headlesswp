import { postService } from '@/lib/services/postService'
import { wordpressAPI } from '@/lib/wordpress'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/post/PostCard'

export const revalidate = 300;

export default async function BeritaPage() {
  const posts = await postService.getAllPosts()

  const mediaUrls = await Promise.all(
    posts.map((post) =>
      wordpressAPI.getMediaUrl(post.featured_media)
    )
  )

  const mediaUrlMap = new Map<number, string | null>()
  posts.forEach((post, index) => {
    mediaUrlMap.set(post.id, mediaUrls[index])
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Semua Berita</h1>
          <p className="text-gray-600 mt-2">Kumpulan berita terkini dari Mitra Banten News</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} mediaUrl={mediaUrlMap.get(post.id)} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}