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
import Icon from '@/components/ui/Icon'
import type { PostWithMediaUrl } from '@/lib/services/IPostService'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }): Promise<Metadata> {
  const resolvedParams = await searchParams
  const query = resolvedParams.q?.trim() || ''
  
  if (!query) {
    return {
      title: 'Cari Berita - Mitra Banten News',
      description: 'Silakan masukkan kata kunci untuk mencari berita di Mitra Banten News.',
      alternates: {
        canonical: `${SITE_URL}/cari`,
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }

  const title = `Cari: "${query}" - Mitra Banten News`
  const description = `Hasil pencarian untuk "${query}" di Mitra Banten News. Temukan berita terkini terkait ${query}.`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/cari?q=${encodeURIComponent(query)}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/cari?q=${encodeURIComponent(query)}`,
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

export default async function CariPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q?.trim() || ''
  const page = parseInt(resolvedParams.page || '1', PARSING.DECIMAL_RADIX)
  const postsPerPage = PAGINATION_LIMITS.SEARCH_POSTS

  let searchResults: PostWithMediaUrl[] = []
  let totalPages = 1
  
  if (query) {
    const result = await enhancedPostService.searchPosts(query, page, postsPerPage)
    searchResults = result.posts
    totalPages = result.totalPages
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          {query ? UI_TEXT.searchPage.heading(query) : UI_TEXT.searchPage.emptySearch}
        </h1>
        {!query ? (
          <EmptyState
            title={UI_TEXT.searchPage.emptySearch}
            description={UI_TEXT.searchPage.emptySearchDescription}
            icon={<Icon type="search" className="h-16 w-16" />}
          />
        ) : searchResults.length > 0 ? (
          <>
            <SectionHeading id="search-results" className="mb-6">
              {UI_TEXT.searchPage.heading(query)}
            </SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((post: PostWithMediaUrl, index: number) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath="/cari" query={{ q: query }} />
            )}
          </>
        ) : (
          <EmptyState
            title={UI_TEXT.searchPage.noResults}
            description={UI_TEXT.searchPage.noResultsDescription(query)}
            action={{ label: UI_TEXT.notFound.backToHome, href: '/' }}
            icon={<Icon type="search" className="h-16 w-16" />}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
