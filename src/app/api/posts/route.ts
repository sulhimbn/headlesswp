import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'
import { corsHeaders, handleCorsPreflight } from '@/lib/api/cors'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`

interface ErrorResponse {
  error: {
    type: string
    message: string
    timestamp: string
  }
}

function createErrorResponse(status: number, errorType: string, message: string): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    error: {
      type: errorType,
      message,
      timestamp: new Date().toISOString(),
    },
  }
  return NextResponse.json(body, { status })
}

export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request)
  if (preflight) {
    return preflight
  }

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
      const error = result.error
      logger.warn('Failed to fetch posts from API', undefined, { 
        module: 'api/posts',
        errorType: error?.type,
        errorMessage: error?.message,
      })

      if (error?.type === 'TIMEOUT_ERROR') {
        return corsHeaders(request, createErrorResponse(504, 'GATEWAY_TIMEOUT', 'WordPress API request timed out'))
      }
      if (error?.type === 'RATE_LIMIT_ERROR') {
        return corsHeaders(request, createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests to WordPress API'))
      }
      if (error?.type === 'SERVER_ERROR') {
        return corsHeaders(request, createErrorResponse(502, 'BAD_GATEWAY', 'WordPress API returned server error'))
      }
      if (error?.type === 'CIRCUIT_BREAKER_OPEN') {
        return corsHeaders(request, createErrorResponse(503, 'SERVICE_UNAVAILABLE', 'WordPress API temporarily unavailable'))
      }
      
      return corsHeaders(request, createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch posts from WordPress API'))
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
    return corsHeaders(request, response)
  } catch (error) {
    logger.error('Error in /api/posts', error, { module: 'api/posts' })
    return corsHeaders(request, createErrorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred'))
  }
}
