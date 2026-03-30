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
import { generateHreflangUrls } from '@/lib/utils/hreflang'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300 // 5 minutes

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = SITE_URL
  const beritaUrl = `${baseUrl}/berita`
  const hreflangEntries = generateHreflangUrls(baseUrl, '/berita')

  const languages: Record<string, string> = {}
  for (const entry of hreflangEntries) {
    languages[entry.lang] = entry.url
  }

  return {
    title: 'Berita Terkini - Mitra Banten News',
    description: UI_TEXT.newsPage.subtitle || 'Portal berita terkini dan terpercaya dari Banten',
    alternates: {
      canonical: beritaUrl,
      languages,
    },
    openGraph: {
      title: 'Berita Terkini - Mitra Banten News',
      description: UI_TEXT.newsPage.subtitle || 'Portal berita terkini dan terpercaya dari Banten',
      url: beritaUrl,
      siteName: 'Mitra Banten News',
      type: 'website',
    },
  }
}

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', PARSING.DECIMAL_RADIX)
  const postsPerPage = PAGINATION_LIMITS.ALL_POSTS

  const { posts, totalPages } = await enhancedPostService.getPaginatedPosts(page, postsPerPage)

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
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
