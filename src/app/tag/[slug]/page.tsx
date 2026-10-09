import { standardizedAPI } from '@/lib/api/standardized'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { UI_TEXT } from '@/lib/constants/uiText'
import { PARSING } from '@/lib/constants/appConstants'
import { isApiResultSuccessful } from '@/lib/api/response'
import { SITE_URL } from '@/lib/api/config'
import { stripHtml } from '@/lib/utils/stripHtml'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 900 // 15 minutes

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const pageUrl = `${SITE_URL}/tag/${params.slug}`
  const tagResult = await standardizedAPI.getTagBySlug(params.slug)

  if (!isApiResultSuccessful(tagResult)) {
    return {
      title: 'Tag Tidak Ditemukan - Mitra Banten News',
      alternates: {
        canonical: pageUrl,
      },
    }
  }

  const tag = tagResult.data
  const title = `Tag: ${tag.name} - Mitra Banten News`
  const description = tag.description
    ? stripHtml(tag.description).substring(0, 160)
    : `Kumpulan berita bertag ${tag.name} dari Mitra Banten News.`

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Mitra Banten News',
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.jpg`],
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

  const postsResult = await enhancedPostService.getPostsByTag(tag.id, page, perPage)

  const enrichedPosts = postsResult.posts
  const totalPages = postsResult.totalPages

  const breadcrumbItems = [
    { label: 'Tag', href: '/tag' },
    { label: tag.name, href: `/tag/${tag.slug}` },
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <h1 id="page-heading" className="sr-only">
          Tag: {tag.name}
        </h1>
        <SectionHeading id="tag" level="h2" className="mb-2">
          Tag: #{tag.name}
        </SectionHeading>
        {tag.description && (
          <p className="text-[hsl(var(--color-text-secondary))] mb-8">{tag.description}</p>
        )}

        {enrichedPosts.length > 0 ? (
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
