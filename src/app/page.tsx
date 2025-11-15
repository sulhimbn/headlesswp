import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArticleCard from '@/components/ArticleCard'
import React from 'react'

function createFallbackPost(id: string, title: string): WordPressPost {
  return {
    id: parseInt(id),
    title: { rendered: title },
    content: { rendered: '<p>Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.</p>' },
    excerpt: { rendered: 'Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.' },
    slug: `fallback-${id}`,
    date: new Date().toISOString(),
    modified: new Date().toISOString(),
    author: 0,
    featured_media: 0,
    categories: [],
    tags: [],
    status: 'publish',
    type: 'post',
    link: ''
  }
}

async function getLatestPosts(): Promise<WordPressPost[]> {
  try {
    return await wordpressAPI.getPosts({ per_page: 6 })
  } catch (error) {
    console.warn('Failed to fetch latest posts during build:', error)
    // Return fallback posts for better UX
    return [
      createFallbackPost('1', 'Berita Utama 1'),
      createFallbackPost('2', 'Berita Utama 2'),
      createFallbackPost('3', 'Berita Utama 3')
    ]
  }
}

async function getCategoryPosts(): Promise<WordPressPost[]> {
  try {
    // For now, get the first 3 posts as category posts
    // In a real implementation, you'd filter by category
    return await wordpressAPI.getPosts({ per_page: 3 })
  } catch (error) {
    console.warn('Failed to fetch category posts during build:', error)
    // Return fallback posts for better UX
    return [
      createFallbackPost('cat-1', 'Berita Kategori 1'),
      createFallbackPost('cat-2', 'Berita Kategori 2'),
      createFallbackPost('cat-3', 'Berita Kategori 3')
    ]
  }
}

export default async function HomePage() {
  const latestPosts = await getLatestPosts()
  const categoryPosts = await getCategoryPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container-responsive py-6 sm:py-8">
        <section className="mb-8 sm:mb-12">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
              Berita Utama
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Berita pilihan dari Mitra Banten News
            </p>
          </div>
          
          <div className="article-grid-large">
            {categoryPosts.map((post: WordPressPost) => (
              <ArticleCard 
                key={post.id} 
                post={post} 
                size="large"
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
              Berita Terkini
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Update berita terbaru hari ini
            </p>
          </div>
          
          <div className="article-grid">
            {latestPosts.map((post: WordPressPost) => (
              <ArticleCard 
                key={post.id} 
                post={post} 
                size="medium"
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}