import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'
import Breadcrumb from '@/components/ui/Breadcrumb'
import Badge from '@/components/ui/Badge'
import MetaInfo from '@/components/ui/MetaInfo'
import Footer from '@/components/layout/Footer'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-static'
export const revalidate = 3600

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await enhancedPostService.getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  // Validate required fields
  if (!post.title.rendered || !post.content.rendered) {
    logger.error('Post is missing required fields:', post)
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

<main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <article className="bg-white rounded-lg shadow-lg overflow-hidden mt-4">
          {post.featured_media > 0 && (
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[450px]">
              <Image
                src={mediaUrl || '/placeholder-image.jpg'}
                alt={post.title.rendered}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 100vw"
              />
            </div>
          )}
          
          <div className="p-8">
            <div className="mb-6">
              <MetaInfo date={post.date} className="mb-4" />
               
              {categoriesDetails.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoriesDetails.map((category) => (
                    <Badge key={category.id} variant="category">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {post.title.rendered}
            </h1>

<div
  className="prose prose-lg max-w-none text-gray-700"
  dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content.rendered, 'full') }}
 />

            {tagsDetails.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tagsDetails.map((tag) => (
                    <Badge key={tag.id} variant="tag">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded px-3 py-2 transition-colors font-medium"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}