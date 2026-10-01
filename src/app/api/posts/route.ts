import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'

const MAX_PER_PAGE = 100
const DEFAULT_PER_PAGE = 10
const DEFAULT_PAGE = 1

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

function validatePaginationParams(perPage: number, page: number): string | null {
  if (isNaN(perPage) || perPage < 1 || perPage > MAX_PER_PAGE) {
    return `per_page must be between 1 and ${MAX_PER_PAGE}`
  }
  if (isNaN(page) || page < 1) {
    return 'page must be greater than or equal to 1'
  }
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categories = searchParams.get('categories')
    const perPage = parseInt(searchParams.get('per_page') || String(DEFAULT_PER_PAGE), 10)
    const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10)

    const validationError = validatePaginationParams(perPage, page)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    }

    if (categories) {
      queryParams.categories = categories
    }

    const result = await standardizedAPI.getAllPosts(queryParams)

    if (!isApiResultSuccessful(result)) {
      const status = result.error?.statusCode || 503
      logger.warn('Failed to fetch posts from API', result.error, { module: 'api/posts' })
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: result.error?.message },
        { status }
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
