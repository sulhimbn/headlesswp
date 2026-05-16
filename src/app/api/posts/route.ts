import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'
import { ApiError, ApiErrorType } from '@/lib/api/errors'

function mapErrorToStatusCode(error: ApiError | null): number {
  if (!error) return 500

  if (error.statusCode) {
    return error.statusCode
  }

  switch (error.type) {
    case ApiErrorType.NETWORK_ERROR:
    case ApiErrorType.TIMEOUT_ERROR:
    case ApiErrorType.CIRCUIT_BREAKER_OPEN:
    case ApiErrorType.RATE_LIMIT_ERROR:
      return 503
    case ApiErrorType.SERVER_ERROR:
      return 500
    case ApiErrorType.CLIENT_ERROR:
      return 404
    default:
      return 500
  }
}

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
      logger.warn('Failed to fetch posts from API', result.error, { module: 'api/posts' })
      const statusCode = mapErrorToStatusCode(result.error)
      return NextResponse.json(
        { error: result.error },
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
    const apiError = error instanceof Error ? {
      type: ApiErrorType.UNKNOWN_ERROR,
      message: error.message,
      retryable: false,
      timestamp: new Date().toISOString()
    } : null
    const statusCode = mapErrorToStatusCode(apiError)
    return NextResponse.json(
      { error: apiError },
      { status: statusCode }
    )
  }
}
