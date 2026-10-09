import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import Badge from '@/components/ui/Badge'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { UI_TEXT } from '@/lib/constants/uiText'
import { SITE_URL } from '@/lib/api/config'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 1800 // 30 minutes

export async function generateMetadata(): Promise<Metadata> {
  const pageUrl = `${SITE_URL}/kategori`
  const title = UI_TEXT.categoryIndexPage.heading
  const description = `${UI_TEXT.categoryIndexPage.subtitle} - Mitra Banten News`

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

export default async function KategoriIndexPage() {
  const categories = await enhancedPostService.getCategories()

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          {UI_TEXT.categoryIndexPage.heading}
        </h1>
        <SectionHeading id="categories" level="h2" className="mb-2">
          {UI_TEXT.categoryIndexPage.heading}
        </SectionHeading>
        <p className="text-[hsl(var(--color-text-secondary))] mb-8">{UI_TEXT.categoryIndexPage.subtitle}</p>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/kategori/${category.slug}`}
                className="block bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 hover:shadow-[var(--shadow-lg)] transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))]">{category.name}</h2>
                  <Badge variant="category">{UI_TEXT.categoryIndexPage.articleCount(category.count)}</Badge>
                </div>
                {category.description && (
                  <p className="text-sm text-[hsl(var(--color-text-secondary))] line-clamp-2">{category.description}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={UI_TEXT.categoryIndexPage.emptyTitle}
            description={UI_TEXT.categoryIndexPage.emptyDescription}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
