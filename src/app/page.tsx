import { GET_POSTS } from '@/lib/graphql'
import { GET_POSTS_BY_CATEGORY } from '@/lib/graphql'
import { client } from '@/lib/apollo'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { GraphQLPost } from '@/types/wordpress'

async function getLatestPosts(): Promise<GraphQLPost[]> {
  const { data } = await client.query<{ posts: { nodes: GraphQLPost[] } }>({
    query: GET_POSTS,
    variables: { first: 6 }
  })
  return data.posts?.nodes || []
}

async function getCategoryPosts(): Promise<GraphQLPost[]> {
  const { data } = await client.query<{ posts: { nodes: GraphQLPost[] } }>({
    query: GET_POSTS_BY_CATEGORY,
    variables: { categorySlug: 'berita-utama', first: 3 }
  })
  return data.posts?.nodes || []
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
            {categoryPosts.map((post: any) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {post.featuredImage?.node && (
                  <div className="relative h-48">
                    <Image
                      src={post.featuredImage.node.sourceUrl}
                      alt={post.featuredImage.node.altText || post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <Link href={`/berita/${post.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600">
                      {post.title}
                    </h3>
                  </Link>
                  <p 
                    className="text-gray-600 mb-3"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
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
            {latestPosts.map((post: any) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {post.featuredImage?.node && (
                  <div className="relative h-48">
                    <Image
                      src={post.featuredImage.node.sourceUrl}
                      alt={post.featuredImage.node.altText || post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <Link href={`/berita/${post.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600">
                      {post.title}
                    </h3>
                  </Link>
                  <p 
                    className="text-gray-600 mb-3"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
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