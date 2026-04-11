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
    const rawPerPage = searchParams.get('per_page')
    const rawPage = searchParams.get('page')
    
    const perPage = (() => {
      const parsed = parseInt(rawPerPage || '10', 10)
      if (isNaN(parsed) || parsed < 1) return 10
      return Math.min(parsed, 100)
    })()
    
    const page = (() => {
      const parsed = parseInt(rawPage || '1', 10)
      if (isNaN(parsed) || parsed < 1) return 1
      return parsed
    })()

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    }

    if (categories) {
      queryParams.categories = categories
    }

    const result = await standardizedAPI.getAllPosts(queryParams)

    if (!isApiResultSuccessful(result)) {
      logger.warn('Failed to fetch posts from API', undefined, { module: 'api/posts' })
      const errorResponse = {
        error: 'Failed to fetch posts',
        details: result.error?.message || 'Unknown error',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    if (!result.data) {
      logger.warn('No posts found', undefined, { module: 'api/posts' })
      return NextResponse.json({ error: 'No posts found' }, { status: 404 })
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
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
