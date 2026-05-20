import { standardizedAPI } from '@/lib/api/standardized'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { UI_TEXT } from '@/lib/constants/uiText'
import { PARSING } from '@/lib/constants/appConstants'
import { isApiResultSuccessful } from '@/lib/api/response'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/api/config'
import { generateCollectionPageSchema, generateBreadcrumbSchemaForPage } from '@/lib/seo/structuredData'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tagResult = await standardizedAPI.getTagBySlug(params.slug)
  
  if (!isApiResultSuccessful(tagResult)) {
    return {
      title: 'Tag Tidak Ditemukan',
    }
  }

  const tag = tagResult.data
  const title = `Tag: #${tag.name} - Mitra Banten News`
  const description = tag.description 
    ? `${tag.description} - Berita terkini dengan tag #${tag.name} di Mitra Banten News.`
    : `Kumpulan berita terkini dengan tag #${tag.name} di Mitra Banten News.`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/tag/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tag/${params.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', PARSING.DECIMAL_RADIX)
  const perPage = 12

  const tagResult = await standardizedAPI.getTagBySlug(params.slug)

  if (!isApiResultSuccessful(tagResult)) {
    notFound()
  }

  const tag = tagResult.data

  const postsResult = await standardizedAPI.getAllPosts({
    page,
    per_page: perPage,
    tag: tag.id
  })

  const posts = postsResult.data
  const totalPages = postsResult.pagination.totalPages ?? 0

  const postsWithMedia = await enhancedPostService.getLatestPosts()

  const enrichedPosts = posts.map(post => {
    const enriched = postsWithMedia.find(p => p.id === post.id)
    return enriched || { ...post, mediaUrl: null }
  })

  const tagUrl = `${SITE_URL}/tag/${params.slug}`
  const collectionPageSchema = generateCollectionPageSchema({
    name: `Tag: #${tag.name}`,
    description: tag.description || undefined,
    url: tagUrl,
    numberOfItems: posts.length,
  })
  const breadcrumbSchema = generateBreadcrumbSchemaForPage([
    { label: 'Beranda', href: '/' },
    { label: 'Tag', href: '/berita' },
    { label: `#${tag.name}`, href: `/tag/${params.slug}` },
  ])

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          Tag: {tag.name}
        </h1>
        <SectionHeading id="tag" level="h2" className="mb-2">
          Tag: #{tag.name}
        </SectionHeading>
        {tag.description && (
          <p className="text-[hsl(var(--color-text-secondary))] mb-8">{tag.description}</p>
        )}

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedPosts.map((post, index) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/tag/${params.slug}`} />
            )}
          </>
        ) : (
          <EmptyState
            title={UI_TEXT.newsPage.emptyTitle}
            description="Tidak ada artikel dengan tag ini."
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
