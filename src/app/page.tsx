import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'
import { handleError } from '@/lib/error-handler'
import Link from 'next/link'
import Image from 'next/image'
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
    handleError(error as Error, {
      component: 'HomePage',
      action: 'getLatestPosts'
    })
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
    handleError(error as Error, {
      component: 'HomePage',
      action: 'getCategoryPosts'
    })
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-red-600">
              Mitra Banten News
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-red-600">Beranda</Link>
              <Link href="/berita" className="text-gray-700 hover:text-red-600">Berita</Link>
              <Link href="/politik" className="text-gray-700 hover:text-red-600">Politik</Link>
              <Link href="/ekonomi" className="text-gray-700 hover:text-red-600">Ekonomi</Link>
              <Link href="/olahraga" className="text-gray-700 hover:text-red-600">Olahraga</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Berita Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryPosts.map((post: WordPressPost) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {post.featured_media > 0 && (
                  <div className="relative h-48">
                    <Image
                      src="/placeholder-image.jpg" // Will be replaced with actual media URL
                      alt={post.title.rendered}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <Link href={`/berita/${post.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600">
                      {post.title.rendered}
                    </h3>
                  </Link>
                  <p 
                    className="text-gray-600 mb-3"
                    dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                  />
                  <div className="text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Berita Terkini</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post: WordPressPost) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {post.featured_media > 0 && (
                  <div className="relative h-48">
                    <Image
                      src="/placeholder-image.jpg" // Will be replaced with actual media URL
                      alt={post.title.rendered}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <Link href={`/berita/${post.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600">
                      {post.title.rendered}
                    </h3>
                  </Link>
                  <p 
                    className="text-gray-600 mb-3"
                    dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                  />
                  <div className="text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 Mitra Banten News. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}