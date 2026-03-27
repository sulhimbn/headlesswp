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
import Link from 'next/link'
import type { PostWithMediaUrl, SemanticSearchResult } from '@/lib/services/IPostService'
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

function RelatedQueries({ queries }: { queries: string[] }) {
  if (queries.length === 0) return null;

  return (
    <div className="mt-8 p-4 bg-[hsl(var(--color-surface))] rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]">
      <h3 className="text-sm font-semibold text-[hsl(var(--color-text-primary))] mb-3">
        {UI_TEXT.searchPage.relatedQueries}
      </h3>
      <div className="flex flex-wrap gap-2">
        {queries.map((q, index) => (
          <Link
            key={index}
            href={`/cari?q=${encodeURIComponent(q)}`}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-[hsl(var(--color-primary))] text-white rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity"
          >
            <Icon type="search" className="w-3 h-3 mr-1.5" />
            {q}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function CariPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q?.trim() || ''
  const page = parseInt(resolvedParams.page || '1', PARSING.DECIMAL_RADIX)
  const postsPerPage = PAGINATION_LIMITS.SEARCH_POSTS

  let searchResults: PostWithMediaUrl[] = []
  let relatedQueries: string[] = []
  let totalPages = 1
  let totalPosts = 0
  
  if (query) {
    const result: SemanticSearchResult = await enhancedPostService.semanticSearchPosts(query, page, postsPerPage)
    searchResults = result.posts
    relatedQueries = result.relatedQueries
    totalPages = result.totalPages
    totalPosts = result.totalPosts
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
            <SectionHeading id="search-results" className="mb-2">
              {UI_TEXT.searchPage.heading(query)}
            </SectionHeading>
            <p className="text-sm text-[hsl(var(--color-text-muted))] mb-6">
              {UI_TEXT.searchPage.searchResultCount(totalPosts)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((post: PostWithMediaUrl, index: number) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {relatedQueries.length > 0 && (
              <RelatedQueries queries={relatedQueries} />
            )}

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
