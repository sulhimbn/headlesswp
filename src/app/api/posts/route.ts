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
    const perPageRaw = searchParams.get('per_page') || '10'
    const pageRaw = searchParams.get('page') || '1'

    const perPage = parseInt(perPageRaw, 10)
    const page = parseInt(pageRaw, 10)

    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'Invalid per_page: must be an integer between 1 and 100' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page: must be a positive integer' },
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
