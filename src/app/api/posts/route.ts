import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categories = searchParams.get('categories')
    const perPage = parseInt(searchParams.get('per_page') || '10', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    }

    if (categories) {
      queryParams.categories = categories
    }

    const result = await standardizedAPI.getAllPosts(queryParams)

    if (!isApiResultSuccessful(result) || !result.data) {
      const errorMessage = result.error 
        ? result.error.message 
        : 'Failed to fetch posts from WordPress API';
      
      logger.warn('Failed to fetch posts from API', undefined, { 
        module: 'api/posts',
        error: result.error,
        hasData: !!result.data 
      });
      
      return NextResponse.json(
        { error: errorMessage, code: result.error?.type || 'API_ERROR' },
        { status: 502 }
      );
    }

    const posts = result.data.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      featured_media: post.featured_media,
      date: post.date,
      categories: post.categories,
      tags: post.tags,
    }))

    const response = NextResponse.json(posts)
    response.headers.set('Cache-Control', CACHE_CONTROL)
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in /api/posts', error, { module: 'api/posts' });
    return NextResponse.json(
      { error: errorMessage, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
