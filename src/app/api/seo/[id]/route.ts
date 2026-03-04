import { NextRequest, NextResponse } from 'next/server'
import { analyzeSEO, isSEOAnalysisEnabled, getSEOConfig } from '@/lib/services/seoAnalyzer'
import { wordpressAPI } from '@/lib/wordpress'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const postId = parseInt(id, 10)

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    const post = await wordpressAPI.getPostById(postId)
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const title = post.title.rendered
    const content = post.content.rendered

    const result = await analyzeSEO(postId, content, title)

    logger.info('SEO analysis API request', { postId, score: result.score, module: 'seo-api' })

    return NextResponse.json({
      postId,
      title,
      useAiAnalysis: getSEOConfig().provider !== 'local',
      score: result.score,
      suggestions: result.suggestions,
      wordCount: result.wordCount,
      readabilityScore: result.readabilityScore,
      analyzedAt: result.analyzedAt,
      config: {
        provider: getSEOConfig().provider,
        enabled: isSEOAnalysisEnabled(),
      },
    })
  } catch (error) {
    logger.error('SEO analysis API error', error, { module: 'seo-api' })
    return NextResponse.json(
      { error: 'Failed to analyze SEO' },
      { status: 500 }
    )
  }
}
