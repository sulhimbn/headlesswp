import { standardizedAPI } from '@/lib/api/standardized';
import { enhancedPostService } from '@/lib/services/enhancedPostService';
import Header from '@/components/layout/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PostCard from '@/components/post/PostCard';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeading from '@/components/ui/SectionHeading';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { UI_TEXT } from '@/lib/constants/uiText';
import { PARSING } from '@/lib/constants/appConstants';
import { isApiResultSuccessful } from '@/lib/api/response';
import { SITE_URL } from '@/lib/api/config';
import { stripHtml } from '@/lib/utils/stripHtml';
import type { Metadata } from 'next';

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <div className="h-64 bg-[hsl(var(--color-background-dark))] mt-12" aria-hidden="true" />,
});

export const revalidate = 1800; // 30 minutes

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const pageUrl = `${SITE_URL}/author/${params.id}`;
  const authorId = parseInt(params.id, PARSING.DECIMAL_RADIX);

  if (isNaN(authorId)) {
    return {
      title: 'Penulis Tidak Ditemukan - Mitra Banten News',
      alternates: {
        canonical: pageUrl,
      },
    };
  }

  const authorResult = await standardizedAPI.getAuthorById(authorId);

  if (!isApiResultSuccessful(authorResult)) {
    return {
      title: 'Penulis Tidak Ditemukan - Mitra Banten News',
      alternates: {
        canonical: pageUrl,
      },
    };
  }

  const author = authorResult.data;
  const title = `${author.name} - Mitra Banten News`;
  const description = author.description
    ? stripHtml(author.description).substring(0, 160)
    : `Artikel oleh ${author.name} di Mitra Banten News.`;

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
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', PARSING.DECIMAL_RADIX);
  const perPage = 12;
  const authorId = parseInt(params.id, PARSING.DECIMAL_RADIX);

  if (isNaN(authorId)) {
    notFound();
  }

  const authorResult = await standardizedAPI.getAuthorById(authorId);

  if (!isApiResultSuccessful(authorResult)) {
    notFound();
  }

  const author = authorResult.data;

  const postsResult = await enhancedPostService.getPostsByAuthor(authorId, page, perPage);

  const enrichedPosts = postsResult.posts;
  const totalPages = postsResult.totalPages;

  const breadcrumbItems = [
    { label: author.name, href: `/author/${authorId}` },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />

      <main id="main-content" aria-labelledby="page-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-[hsl(var(--color-background-secondary))] rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            {author.avatar_urls && author.avatar_urls['96'] && (
              <OptimizedImage
                src={author.avatar_urls['96']}
                alt={author.name}
                width={96}
                height={96}
                className="rounded-full"
                context="thumbnail"
                priority
              />
            )}
            <div>
              <h1 id="page-heading" className="text-2xl font-bold text-[hsl(var(--color-text-primary))]">
                {author.name}
              </h1>
              {author.description && (
                <p className="text-[hsl(var(--color-text-secondary))] mt-2">{author.description}</p>
              )}
              {author.link && (
                <a
                  href={author.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))] text-sm mt-2 inline-block"
                >
                  {UI_TEXT.authorPage.website || 'Website'}
                </a>
              )}
            </div>
          </div>
        </div>

        <SectionHeading id="author-posts" level="h2" className="mb-6">
          {UI_TEXT.authorPage.articlesBy || 'Artikel oleh'} {author.name}
        </SectionHeading>

        {enrichedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedPosts.map((post, index) => (
                <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 6} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/author/${params.id}`} />
            )}
          </>
        ) : (
          <EmptyState
            title={UI_TEXT.newsPage.emptyTitle}
            description={UI_TEXT.authorPage.noArticles || 'Belum ada artikel dari penulis ini.'}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
