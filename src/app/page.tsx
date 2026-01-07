import { postService } from '@/lib/services/postService'
import { WordPressPost } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default async function HomePage() {
  const latestPosts = await postService.getLatestPosts()
  const categoryPosts = await postService.getCategoryPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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

      <Footer />
    </div>
  )
}