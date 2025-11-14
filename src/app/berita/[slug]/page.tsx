import { GET_POST_BY_SLUG } from '@/lib/graphql'
import { client } from '@/lib/apollo'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import DOMPurify from 'dompurify'
import { GraphQLPost, GraphQLResponse } from '@/types/wordpress'

async function getPost(slug: string): Promise<GraphQLPost | null> {
  try {
    const { data } = await client.query<GraphQLResponse>({
      query: GET_POST_BY_SLUG,
      variables: { slug },
      errorPolicy: 'all' // This allows partial results even if there are errors
    })
    return data?.post || null
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
  if (!post.title || !post.content) {
    console.error('Post is missing required fields:', post)
    notFound()
  }

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {post.featuredImage?.node && (
            <div className="relative h-96">
              <Image
                src={post.featuredImage.node.sourceUrl}
                alt={post.featuredImage.node.altText || post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>By {post.author?.node?.name || 'Admin'}</span>
                <span>•</span>
                <span>
                  {new Date(post.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {post.categories?.nodes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.nodes.map((category: any) => (
                    <Link
                      key={category.id}
                      href={`/kategori/${category.slug}`}
                      className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full hover:bg-red-200"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>

<div 
  className="prose prose-lg max-w-none text-gray-700"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
/>

            {post.tags?.nodes?.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.nodes.map((tag: any) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full hover:bg-gray-200"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-red-600 hover:text-red-700"
          >
            ← Kembali ke Beranda
          </Link>
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