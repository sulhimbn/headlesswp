import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'
import Breadcrumb from '@/components/ui/Breadcrumb'
import Badge from '@/components/ui/Badge'
import MetaInfo from '@/components/ui/MetaInfo'
import PostCard from '@/components/post/PostCard'
import SectionHeading from '@/components/ui/SectionHeading'
import type { PostWithMediaUrl } from '@/lib/services/IPostService'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/utils/logger'
import { UI_TEXT } from '@/lib/constants/uiText'
import { SITE_URL } from '@/lib/api/config'
import type { Metadata } from 'next'
import PersonalizedRecommendations from '@/components/post/PersonalizedRecommendations'
import ReadingTracker from '@/components/post/ReadingTracker'
import { calculateReadingTime } from '@/lib/utils/readingTime'
import SocialShare from '@/components/ui/SocialShare'
import ReadingProgress from '@/components/ui/ReadingProgress'
import TableOfContents from '@/components/ui/TableOfContents'
import { extractHeadings, shouldShowToc, addIdsToHeadings } from '@/lib/utils/tableOfContents'

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />
})

export const revalidate = 3600 // 60 minutes (1 hour)

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim()
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await enhancedPostService.getPostBySlug(params.slug)
  const baseUrl = SITE_URL

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const description = stripHtml(post.excerpt.rendered).substring(0, 160)
  const articleUrl = `${baseUrl}/berita/${post.slug}`

  return {
    title: post.title.rendered,
    description,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: post.title.rendered,
      description,
      url: articleUrl,
      siteName: 'Mitra Banten News',
      images: [
        {
          url: post.mediaUrl ? post.mediaUrl : `${baseUrl}/api/og/${post.slug}`,
          width: 1200,
          height: 630,
          alt: stripHtml(post.title.rendered),
        },
      ],
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: [post.authorDetails?.name || 'Mitra Banten News'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title.rendered,
      description,
      images: [post.mediaUrl ? post.mediaUrl : `${baseUrl}/api/og/${post.slug}`],
    },
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await enhancedPostService.getPostBySlug(params.slug)

  let relatedPosts: PostWithMediaUrl[] = []

  if (post && post.categories.length > 0) {
    relatedPosts = await enhancedPostService.getRelatedPosts(post.categories, post.id)
  }

  if (!post) {
    notFound()
  }

  if (!post.title.rendered || !post.content.rendered) {
    logger.error('Post is missing required fields:', undefined, { post })
    notFound()
  }

  const { mediaUrl, categoriesDetails, tagsDetails, authorDetails } = post

  const readingTime = calculateReadingTime(post.content.rendered)

  const headings = extractHeadings(post.content.rendered)
  const showToc = shouldShowToc(headings)
  const contentWithIds = showToc ? addIdsToHeadings(post.content.rendered) : post.content.rendered

  const breadcrumbItems = [
    { label: 'Berita', href: '/berita' },
    { label: post.title.rendered, href: `/berita/${post.slug}` }
  ]

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Berita',
        item: `${SITE_URL}/berita`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.title.rendered,
        item: `${SITE_URL}/berita/${post.slug}`,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <ReadingProgress targetId="article-content" />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReadingTracker
          postId={post.id}
          slug={post.slug}
          title={post.title.rendered}
          categoryIds={post.categories}
          tagIds={post.tags}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema)
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: post.title.rendered,
              image: [post.mediaUrl || `${SITE_URL}/og-image.jpg`],
              datePublished: post.date,
              dateModified: post.modified,
              author: [{
                '@type': 'Person',
                name: post.authorDetails?.name || 'Mitra Banten News',
              }],
              publisher: {
                '@type': 'Organization',
                name: 'Mitra Banten News',
                logo: {
                  '@type': 'ImageObject',
                  url: `${SITE_URL}/logo.png`,
                },
              },
              description: stripHtml(post.excerpt.rendered),
              url: `${SITE_URL}/berita/${post.slug}`,
            })
          }}
        />
        <h1 id="page-heading" className="sr-only">
          {post.title.rendered}
        </h1>
        <Breadcrumb items={breadcrumbItems} />
        <article aria-labelledby="article-heading" id="article-content" className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden mt-4">
          {post.featured_media > 0 && (
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[450px]">
              <Image
                src={mediaUrl || '/placeholder-image.jpg'}
                alt={post.title.rendered}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 100vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=="
              />
            </div>
          )}

          <div className="p-8">
            <div className="mb-6">
              <MetaInfo date={post.date} className="mb-4" readingTime={readingTime} />

              {authorDetails && (
                <div className="flex items-center gap-2 mb-4">
                  {authorDetails.avatar_urls && Object.keys(authorDetails.avatar_urls).length > 0 && (
                    <Image
                      src={authorDetails.avatar_urls['96'] || authorDetails.avatar_urls['48'] || authorDetails.avatar_urls['24']}
                      alt={authorDetails.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                      loading="lazy"
                    />
                  )}
                  <Link
                    href={`/author/${authorDetails.id}`}
                    className="text-sm font-medium text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))] transition-colors"
                  >
                    {authorDetails.name}
                  </Link>
                </div>
              )}

              {categoriesDetails.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoriesDetails.map((category) => (
                    <Badge key={category.id} variant="category" href={`/kategori/${category.slug}`}>
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <h1 id="article-heading" className="text-4xl font-bold text-[hsl(var(--color-text-primary))] mb-4">
              {post.title.rendered}
            </h1>

            <div className="mb-6">
              <SocialShare
                title={stripHtml(post.title.rendered)}
                url={`/berita/${post.slug}`}
              />
            </div>

            {showToc && (
              <TableOfContents headings={headings} className="mb-6" />
            )}

            <div
              className="prose prose-lg max-w-none text-[hsl(var(--color-text-secondary))]"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(contentWithIds, 'full') }}
            />

            {tagsDetails.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[hsl(var(--color-border))]">
                <h3 className="text-sm font-semibold text-[hsl(var(--color-text-muted))] mb-3">{UI_TEXT.postDetail.tags}</h3>
                <div className="flex flex-wrap gap-2">
                  {tagsDetails.map((tag) => (
                    <Badge key={tag.id} variant="tag" href={`/tag/${tag.slug}`}>
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-12">
            <SectionHeading id="related-heading" className="mb-6">
              {UI_TEXT.homePage.relatedHeading || 'Artikel Terkait'}
            </SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <PostCard 
                  key={relatedPost.id} 
                  post={relatedPost} 
                  mediaUrl={relatedPost.mediaUrl} 
                />
              ))}
            </div>
          </section>
        )}

        <PersonalizedRecommendations
          currentPostId={post.id}
          currentCategoryIds={post.categories}
        />

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)] px-3 py-2 transition-colors duration-[var(--transition-fast)] font-medium"
          >
            ← {UI_TEXT.postDetail.backToHome}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
