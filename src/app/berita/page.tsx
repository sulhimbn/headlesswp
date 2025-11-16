import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { getTitle, getExcerpt } from '@/lib/data-normalization'

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Semua Berita</h1>
          <p className="text-gray-600 mt-2">Kumpulan berita terkini dari Mitra Banten News</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: WordPressPost) => (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {post.featured_media && typeof post.featured_media === 'number' && post.featured_media > 0 && (
                <div className="relative h-48">
                  <Image
                    src="/placeholder-image.jpg" // Will be replaced with actual media URL
                    alt={getTitle(post)}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
<Link href={`/berita/${post.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600">
                      {getTitle(post)}
                    </h3>
                  </Link>
                  <p 
                    className="text-gray-600 mb-3"
                    dangerouslySetInnerHTML={{ __html: getExcerpt(post) }}
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