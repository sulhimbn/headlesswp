import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES, REVALIDATE_TIMES } from '@/lib/api/config'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

const API_QUERY_LIMITS = {
  MAX_PER_PAGE: 100,
  MAX_PAGE: 1000,
} as const

function sanitizeAndValidateParams(searchParams: URLSearchParams) {
  const perPageRaw = searchParams.get('per_page')
  const pageRaw = searchParams.get('page')

  let perPage = parseInt(perPageRaw || '10', 10)
  if (isNaN(perPage) || perPage < 1) perPage = 10
  perPage = Math.min(perPage, API_QUERY_LIMITS.MAX_PER_PAGE)

  let page = parseInt(pageRaw || '1', 10)
  if (isNaN(page) || page < 1) page = 1
  page = Math.min(page, API_QUERY_LIMITS.MAX_PAGE)

  return { perPage, page }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categories = searchParams.get('categories')

    const { perPage, page } = sanitizeAndValidateParams(searchParams)

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    }

    if (categories) {
      const sanitizedCategories = categories.replace(/[^0-9,]/g, '')
      queryParams.categories = sanitizedCategories
    }

    const result = await standardizedAPI.getAllPosts(queryParams)

    if (!isApiResultSuccessful(result)) {
      const errorMsg = result.error?.message || 'Failed to fetch posts from WordPress API'
      logger.warn('Failed to fetch posts from API', undefined, { module: 'api/posts', error: result.error })
      return NextResponse.json(
        { error: errorMsg, details: result.error },
        { status: 503 }
      )
    }

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: 'No posts found', posts: [] },
        { status: 200 }
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
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const revalidate = REVALIDATE_TIMES.POST_LIST
