import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

function sanitizeString(value: string | null): string {
  if (!value) return ''
  return value.replace(/[<>"'&]/g, '').slice(0, 500)
}

function sanitizeNumber(value: string | null, defaultValue: number, max: number): number {
  const parsed = parseInt(value || String(defaultValue), 10)
  if (isNaN(parsed) || parsed < 1) return defaultValue
  if (parsed > max) return max
  return parsed
}

async function postsHandler(_request: Request) {
  try {
    const { searchParams } = new URL(_request.url)
    const categories = sanitizeString(searchParams.get('categories'))
    const perPage = sanitizeNumber(searchParams.get('per_page'), 10, 100)
    const page = sanitizeNumber(searchParams.get('page'), 1, 1000)

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    }

    if (categories) {
      queryParams.categories = categories
    }

    const result = await standardizedAPI.getAllPosts(queryParams)

    if (!isApiResultSuccessful(result) || !result.data) {
      logger.warn('Failed to fetch posts from API', undefined, { module: 'api/posts' })
      return NextResponse.json([], { status: 200 })
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
    return NextResponse.json([], { status: 200 })
  }
}

export const GET = withApiRateLimit(postsHandler, 'metrics')
