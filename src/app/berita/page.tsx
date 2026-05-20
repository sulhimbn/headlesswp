import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import { PAGINATION_LIMITS, SITE_URL } from '@/lib/api/config'
import dynamic from 'next/dynamic'
import { UI_TEXT } from '@/lib/constants/uiText'
import { PARSING } from '@/lib/constants/appConstants'
import { generateCollectionPageSchema, generateBreadcrumbSchemaForPage } from '@/lib/seo/structuredData'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300

export const metadata: Metadata = {
  title: {
    default: 'Semua Berita - Mitra Banten News',
    template: '%s - Mitra Banten News',
  },
  description: UI_TEXT.newsPage.subtitle,
  alternates: {
    canonical: `${SITE_URL}/berita`,
  },
  openGraph: {
    title: 'Semua Berita - Mitra Banten News',
    description: UI_TEXT.newsPage.subtitle,
    url: `${SITE_URL}/berita`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Semua Berita - Mitra Banten News',
    description: UI_TEXT.newsPage.subtitle,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', PARSING.DECIMAL_RADIX)
  const postsPerPage = PAGINATION_LIMITS.ALL_POSTS

  const { posts, totalPages } = await enhancedPostService.getPaginatedPosts(page, postsPerPage)

  const beritaUrl = `${SITE_URL}/berita`
  const collectionPageSchema = generateCollectionPageSchema({
    name: UI_TEXT.newsPage.heading,
    description: UI_TEXT.newsPage.subtitle,
    url: beritaUrl,
    numberOfItems: posts.length,
  })
  const breadcrumbSchema = generateBreadcrumbSchemaForPage([
    { label: 'Beranda', href: '/' },
    { label: 'Berita', href: '/berita' },
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
          {UI_TEXT.newsPage.heading}
        </h1>
        <SectionHeading id="news" level="h2" className="mb-2">
          {UI_TEXT.newsPage.heading}
        </SectionHeading>
        <p className="text-[hsl(var(--color-text-secondary))] mb-8">{UI_TEXT.newsPage.subtitle}</p>

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath="/berita" />
            )}
          </>
        ) : (
          <EmptyState
            title={UI_TEXT.newsPage.emptyTitle}
            description={UI_TEXT.newsPage.emptyDescription}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
