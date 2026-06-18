import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import SearchInput from '@/components/ui/SearchInput'
import { PAGINATION_LIMITS } from '@/lib/api/config'
import dynamic from 'next/dynamic'
import { UI_TEXT } from '@/lib/constants/uiText'
import { PARSING } from '@/lib/constants/appConstants'
import Icon from '@/components/ui/Icon'
import type { PostWithMediaUrl } from '@/lib/services/IPostService'
import { API_QUERY_LIMITS } from '@/lib/api/config'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300 // 5 minutes

interface SearchPageProps {
  searchParams: { q?: string; page?: string }
}

export default async function CariPage({ searchParams }: SearchPageProps) {
  const rawQuery = searchParams.q?.trim() || ''
  const validatedPage = Math.min(
    Math.max(1, parseInt(searchParams.page || '1', PARSING.DECIMAL_RADIX)),
    API_QUERY_LIMITS.MAX_PAGE
  )
  const query = rawQuery.slice(0, API_QUERY_LIMITS.MAX_QUERY_LENGTH)
  const postsPerPage = Math.min(PAGINATION_LIMITS.SEARCH_POSTS, API_QUERY_LIMITS.MAX_PER_PAGE)

  let searchResults: PostWithMediaUrl[] = []
  let totalPages = 1
  
  if (query) {
    const result = await enhancedPostService.searchPosts(query, validatedPage, postsPerPage)
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
        
        <section aria-label="Search" className="mb-8">
          <SearchInput initialValue={query} />
        </section>

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
              <Pagination currentPage={validatedPage} totalPages={totalPages} basePath="/cari" query={{ q: query }} />
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
