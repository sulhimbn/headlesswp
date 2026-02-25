import { NextResponse } from 'next/server';
import { wordpressAPI } from '@/lib/wordpress';
import { apiClient, getApiUrl } from '@/lib/api/client';
import type { WordPressPost } from '@/types/wordpress';
import { createCategoryRSSFeed, createRSSFeed } from '@/lib/utils/rss';
import { CACHE_TIMES } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const categories = await wordpressAPI.getCategories();
    const category = categories.find(c => c.slug === slug);

    if (!category) {
      return new NextResponse('Category not found', { status: 404 });
    }

    const response = await apiClient.get<WordPressPost[]>(getApiUrl('/wp/v2/posts'), {
      params: {
        categories: category.id,
        per_page: 50,
        _fields: 'id,title,excerpt,slug,date,modified,link,categories,tags,author'
      }
    });
    const posts = response.data;

    const feed = createCategoryRSSFeed(posts, category);
    const rssXML = createRSSFeed(feed);

    return new NextResponse(rssXML, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}`,
      },
    });
  } catch (error) {
    console.error('Error generating category RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
