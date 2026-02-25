import { NextResponse } from 'next/server';
import { apiClient, getApiUrl } from '@/lib/api/client';
import type { WordPressPost } from '@/types/wordpress';
import { createMainRSSFeed, createRSSFeed } from '@/lib/utils/rss';
import { CACHE_TIMES } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await apiClient.get<WordPressPost[]>(getApiUrl('/wp/v2/posts'), {
      params: {
        per_page: 50,
        _fields: 'id,title,excerpt,slug,date,modified,link,categories,tags,author'
      }
    });
    const posts = response.data;

    const feed = createMainRSSFeed(posts);
    const rssXML = createRSSFeed(feed);

    return new NextResponse(rssXML, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}`,
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
