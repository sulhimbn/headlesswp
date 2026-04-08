import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful, getHttpStatusCode } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'
import { API_QUERY_LIMITS } from '@/lib/api/config'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

function sanitizeAndValidateNumber(value: string | null, defaultValue: number, max: number): number {
  const parsed = parseInt(value || String(defaultValue), 10)
  if (isNaN(parsed) || parsed < 1) return defaultValue
  return Math.min(parsed, max)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categories = searchParams.get('categories')
    const perPage = sanitizeAndValidateNumber(searchParams.get('per_page'), 10, API_QUERY_LIMITS.MAX_PER_PAGE)
    const page = sanitizeAndValidateNumber(searchParams.get('page'), 1, API_QUERY_LIMITS.MAX_PAGE)

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    }

    if (categories) {
      queryParams.categories = categories.replace(/[<>'"&;]/g, '').slice(0, 100)
    }

    const result = await standardizedAPI.getAllPosts(queryParams)

    if (!isApiResultSuccessful(result) || !result.data) {
      logger.warn('Failed to fetch posts from API', undefined, { module: 'api/posts' })
      const statusCode = result.error ? getHttpStatusCode(result.error) : 500
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch posts' },
        { status: statusCode }
      )
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
    logger.error('Error in /api/posts', error, { module: 'api/posts' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
