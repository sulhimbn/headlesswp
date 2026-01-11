import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import Footer from '@/components/layout/Footer'
import { UI_TEXT } from '@/lib/constants/uiText'
import Icon from '@/components/ui/Icon'
import type { PostWithMediaUrl } from '@/lib/services/IPostService'

export const revalidate = 300

interface SearchPageProps {
  searchParams: { q?: string }
}

export default async function CariPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || ''

  let searchResults: PostWithMediaUrl[] = []
  
  if (query) {
    searchResults = await enhancedPostService.searchPosts(query)
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!query ? (
          <EmptyState
            title={UI_TEXT.searchPage.emptySearch}
            description={UI_TEXT.searchPage.emptySearchDescription}
            icon={<Icon type="search" className="h-16 w-16" />}
          />
        ) : searchResults.length > 0 ? (
          <>
            <SectionHeading className="mb-6">
              {UI_TEXT.searchPage.heading(query)}
            </SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((post: PostWithMediaUrl, index: number) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>
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
