import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/post/PostCard'

export const revalidate = 300;

export default async function HomePage() {
  const [latestPosts, categoryPosts] = await Promise.all([
    enhancedPostService.getLatestPosts(),
    enhancedPostService.getCategoryPosts()
  ])

  const mediaUrlMap = new Map<number, string | null>()
  
  for (const post of [...latestPosts, ...categoryPosts]) {
    mediaUrlMap.set(post.id, post.mediaUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Berita Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryPosts.map((post) => (
              <PostCard key={post.id} post={post} mediaUrl={mediaUrlMap.get(post.id)} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Berita Terkini</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} mediaUrl={mediaUrlMap.get(post.id)} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}