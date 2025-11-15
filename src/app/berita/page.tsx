import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArticleCard from '@/components/ArticleCard'
import React from 'react'

async function getAllPosts(): Promise<WordPressPost[]> {
  try {
    return await wordpressAPI.getPosts({ per_page: 50 })
  } catch (error) {
    console.warn('Failed to fetch posts during build:', error)
    return []
  }
}

export default async function BeritaPage() {
  const posts = await getAllPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container-responsive py-6 sm:py-8">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-balance">
            Semua Berita
          </h1>
          <p className="text-gray-600 mt-3 sm:mt-4 text-base sm:text-lg max-w-3xl">
            Kumpulan berita terkini dari Mitra Banten News
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="article-grid">
            {posts.map((post: WordPressPost) => (
              <ArticleCard 
                key={post.id} 
                post={post} 
                size="medium"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Belum ada berita tersedia.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}