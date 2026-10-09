import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { cacheInitializer } from '@/lib/services/cacheInitializer'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import SectionHeading from '@/components/ui/SectionHeading'
import dynamic from 'next/dynamic'
import { UI_TEXT } from '@/lib/constants/uiText'
import { SITE_URL } from '@/lib/api/config'
import type { Metadata } from 'next'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 300 // 5 minutes

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Mitra Banten News - Berita Terkini Banten'
  const description = 'Portal berita terkini dan terpercaya dari Banten'

  return {
    title,
    description,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
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

export default async function HomePage() {
  cacheInitializer.initialize().catch(() => {})

  const [latestPosts, categoryPosts] = await Promise.all([
    enhancedPostService.getLatestPosts(),
    enhancedPostService.getCategoryPosts()
  ])

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 id="page-heading" className="sr-only">
          {UI_TEXT.homePage.featuredHeading}
        </h1>
        <section className="mb-12" aria-labelledby="featured">
          <SectionHeading id="featured" className="mb-6">
            {UI_TEXT.homePage.featuredHeading}
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryPosts.map((post, index) => (
              <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 3} />
            ))}
          </div>
        </section>

        <section aria-labelledby="latest">
          <SectionHeading id="latest" className="mb-6">
            {UI_TEXT.homePage.latestHeading}
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post, index) => (
              <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 3} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}