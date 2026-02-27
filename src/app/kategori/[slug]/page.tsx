import { standardizedAPI } from '@/lib/api/standardized'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { SITE_URL } from '@/lib/api/config'
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

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', PARSING.DECIMAL_RADIX)
  const perPage = 12

  const categoryResult = await standardizedAPI.getCategoryBySlug(params.slug)

  if (!isApiResultSuccessful(categoryResult)) {
    notFound()
  }

  const category = categoryResult.data

  const postsResult = await enhancedPostService.getPostsByCategory(category.id, page, perPage)

  const enrichedPosts = postsResult.posts
  const totalPages = postsResult.totalPages

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Beranda',
                  item: SITE_URL,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: category.name,
                  item: `${SITE_URL}/kategori/${params.slug}`,
                },
              ],
            })
          }}
        />
        <h1 id="page-heading" className="sr-only">
          Kategori: {category.name}
        </h1>
        <SectionHeading id="category" level="h2" className="mb-2">
          Kategori: {category.name}
        </SectionHeading>
        {category.description && (
          <p className="text-[hsl(var(--color-text-secondary))] mb-8">{category.description}</p>
        )}

        {enrichedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedPosts.map((post, index) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/kategori/${params.slug}`} />
            )}
          </>
        ) : (
          <EmptyState
            title={UI_TEXT.newsPage.emptyTitle}
            description="Tidak ada artikel dalam kategori ini."
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
