import { NextResponse } from 'next/server';
import { apiClient, getApiUrl } from '@/lib/api/client';
import type { WordPressPost } from '@/types/wordpress';
import { createMainJSONFeed } from '@/lib/utils/jsonFeed';
import { CACHE_TIMES } from '@/lib/api/config';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await apiClient.get<WordPressPost[]>(getApiUrl('/wp/v2/posts'), {
      params: {
        per_page: 50,
        _fields: 'id,title,excerpt,slug,date,modified,link,content'
      }
    });
    const posts = response.data;

    const feed = createMainJSONFeed(posts);
    const json = JSON.stringify(feed, null, 2);

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}`,
      },
    });
  } catch (error) {
    logger.error('Error generating JSON Feed', error, { module: 'JSONFeed' });
    return new NextResponse('Error generating JSON Feed', { status: 500 });
  }
}