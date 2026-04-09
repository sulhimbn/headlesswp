import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { sanitizeSearchQuery } from '@/lib/utils/querySanitizer'
import { API_QUERY_LIMITS } from '@/lib/api/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.get('q') || ''
    const query = sanitizeSearchQuery(queryString, '1', '8').query

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], message: 'Query too short' }, { status: 200 })
    }

    const result = await standardizedAPI.searchPosts(query, 1, API_QUERY_LIMITS.AUTOCOMPLETE)

    if (result.error || !result.data) {
      return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
    }

    const suggestions = result.data.map((post) => ({
      id: post.id,
      title: post.title.rendered,
      slug: post.slug,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 100),
    }))

    return NextResponse.json({ results: suggestions })
  } catch {
    return NextResponse.json({ results: [], error: 'Internal server error' }, { status: 500 })
  }
}