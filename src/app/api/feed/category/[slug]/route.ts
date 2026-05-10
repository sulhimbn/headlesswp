import { NextResponse } from 'next/server';
import { wordpressAPI } from '@/lib/wordpress';
import { apiClient, getApiUrl } from '@/lib/api/client';
import type { WordPressPost } from '@/types/wordpress';
import { createCategoryJSONFeed } from '@/lib/utils/jsonfeed';
import { CACHE_TIMES } from '@/lib/api/config';
import { logger } from '@/lib/utils/logger';

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
        _fields: 'id,title,content,excerpt,slug,date,modified,link,categories,tags,author'
      }
    });
    const posts = response.data;

    const feed = createCategoryJSONFeed(posts, category);
    const jsonFeed = JSON.stringify(feed, null, 2);

    return new NextResponse(jsonFeed, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}`,
      },
    });
  } catch (error) {
    logger.error('Error generating category JSON feed', error, { module: 'JSONFeed' });
    return new NextResponse('Error generating JSON feed', { status: 500 });
  }
}
