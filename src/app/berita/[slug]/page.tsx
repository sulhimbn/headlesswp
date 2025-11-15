import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import React from 'react'

async function getPost(slug: string): Promise<WordPressPost | null> {
  try {
    const post = await wordpressAPI.getPost(slug)
    return post || null
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error)
    return null
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  // Validate required fields
  if (!post.title.rendered || !post.content.rendered) {
    console.error('Post is missing required fields:', post)
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container-responsive py-6 sm:py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {post.featured_media > 0 && (
            <div className="relative h-64 sm:h-80 lg:h-96">
              <Image
                src="/placeholder-image.jpg" // Will be replaced with actual media URL
                alt={post.title.rendered}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                priority
              />
            </div>
          )}
          
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 mb-4 space-y-2 sm:space-y-0">
                <span>By Admin</span>
                <span className="hidden sm:inline">•</span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </time>
              </div>
              
              {post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map((categoryId: number) => (
                    <span
                      key={categoryId}
                      className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      Category {categoryId}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 text-balance leading-tight">
              {post.title.rendered}
            </h1>

            <div 
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />

            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tagId: number) => (
                    <span
                      key={tagId}
                      className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      #{tagId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="mt-8 sm:mt-12">
          <Link 
            href="/" 
            className="btn-secondary inline-flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}