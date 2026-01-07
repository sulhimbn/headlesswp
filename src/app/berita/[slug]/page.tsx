import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import DOMPurify from 'isomorphic-dompurify'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export const revalidate = 600; // Revalidate every 10 minutes

const sanitizeHTML = (html: string): string => {
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'id'
    ],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
  }
  return DOMPurify.sanitize(html, config)
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await enhancedPostService.getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  // Validate required fields
  if (!post.title.rendered || !post.content.rendered) {
    console.error('Post is missing required fields:', post)
    notFound()
  }

  const { mediaUrl, categoriesDetails, tagsDetails } = post

  const breadcrumbItems = [
    { label: 'Berita', href: '/berita' },
    { label: post.title.rendered, href: `/berita/${post.slug}` }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <article className="bg-white rounded-lg shadow-lg overflow-hidden mt-4">
          {post.featured_media > 0 && (
            <div className="relative h-96">
              <Image
                src={mediaUrl || '/placeholder-image.jpg'}
                alt={post.title.rendered}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>By Admin</span>
                <span>•</span>
                <span>
                  {new Date(post.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {categoriesDetails.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoriesDetails.map((category) => (
                    <span
                      key={category.id}
                      className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {post.title.rendered}
            </h1>

<div
  className="prose prose-lg max-w-none text-gray-700"
  dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content.rendered) }}
 />

            {tagsDetails.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tagsDetails.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded px-2 py-1 transition-colors"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}