import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import Badge from '@/components/ui/Badge'
import dynamic from 'next/dynamic'
import { UI_TEXT } from '@/lib/constants/uiText'
import { SITE_URL } from '@/lib/api/config'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 1800 // 30 minutes

export async function generateMetadata(): Promise<Metadata> {
  const pageUrl = `${SITE_URL}/tag`
  const title = UI_TEXT.tagIndexPage.heading
  const description = `${UI_TEXT.tagIndexPage.subtitle} - Mitra Banten News`

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

export default async function TagIndexPage() {
  const tags = await enhancedPostService.getTags()

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          {UI_TEXT.tagIndexPage.heading}
        </h1>
        <SectionHeading id="tags" level="h2" className="mb-2">
          {UI_TEXT.tagIndexPage.heading}
        </SectionHeading>
        <p className="text-[hsl(var(--color-text-secondary))] mb-8">{UI_TEXT.tagIndexPage.subtitle}</p>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="tag" href={`/tag/${tag.slug}`} className="text-sm px-3 py-2">
                #{tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState
            title={UI_TEXT.tagIndexPage.emptyTitle}
            description={UI_TEXT.tagIndexPage.emptyDescription}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
