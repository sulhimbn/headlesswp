import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES, API_QUERY_LIMITS } from '@/lib/api/config'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}

async function postsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categories = searchParams.get('categories')
    const search = searchParams.get('search')
    const rawPerPage = parseInt(searchParams.get('per_page') || '10', 10)
    const rawPage = parseInt(searchParams.get('page') || '1', 10)
    const perPage = clampValue(rawPerPage, 1, API_QUERY_LIMITS.MAX_PER_PAGE)
    const page = clampValue(rawPage, 1, API_QUERY_LIMITS.MAX_PAGE)

    let result

    if (search) {
      result = await standardizedAPI.searchPosts(search, page, perPage)
    } else {
      const queryParams: Record<string, string | number> = {
        per_page: perPage,
        page,
      }

      if (categories) {
        queryParams.categories = categories
      }

      result = await standardizedAPI.getAllPosts(queryParams)
    }

    if (!isApiResultSuccessful(result) || !result.data) {
      logger.warn('Failed to fetch posts from API', undefined, { module: 'api/posts' })
      return NextResponse.json({ error: 'Failed to fetch posts', details: result.error }, { status: 500 })
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

    const response = NextResponse.json({ posts })
    response.headers.set('Cache-Control', CACHE_CONTROL)
    return response
  } catch (error) {
    logger.error('Error in /api/posts', error, { module: 'api/posts' })
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}

export const GET = withApiRateLimit(postsHandler, 'posts')
