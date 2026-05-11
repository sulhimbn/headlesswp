import { NextResponse } from 'next/server';
import { apiClient, getApiUrl } from '@/lib/api/client';
import type { WordPressPost } from '@/types/wordpress';
import { createMainJSONFeed } from '@/lib/utils/jsonfeed';
import { CACHE_TIMES } from '@/lib/api/config';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await apiClient.get<WordPressPost[]>(getApiUrl('/wp/v2/posts'), {
      params: {
        per_page: 50,
        _fields: 'id,title,content,excerpt,slug,date,modified,link,categories,tags,author'
      }
    });
    const posts = response.data;

    const feed = createMainJSONFeed(posts);
    const jsonFeed = JSON.stringify(feed, null, 2);

    return new NextResponse(jsonFeed, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}`,
      },
    });
  } catch (error) {
    logger.error('Error generating JSON feed', error, { module: 'JSONFeed' });
    return new NextResponse('Error generating JSON feed', { status: 500 });
  }
}
