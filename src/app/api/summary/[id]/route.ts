import { NextRequest, NextResponse } from 'next/server';
import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer';
import { wordpressAPI } from '@/lib/wordpress';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

function sanitizePostId(id: string): number | null {
  const parsed = parseInt(id, 10)
  if (isNaN(parsed) || parsed < 1 || parsed > 2147483647) return null
  return parsed
}

async function summaryHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const postId = sanitizePostId(id);

    if (postId === null) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const post = await wordpressAPI.getPostById(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const result = await summarizePost(postId, post.content.rendered);

    logger.info('Summary API request', { postId, module: 'summary-api' });

    return NextResponse.json({
      postId,
      useAiSummary: true,
      summary: result.summary,
      originalLength: result.originalLength,
      summaryLength: result.summaryLength,
      cached: result.cached,
      generatedAt: result.generatedAt,
      config: {
        provider: getSummarizationConfig().provider,
        enabled: isSummarizationEnabled(),
      },
    });
  } catch (error) {
    logger.error('Summary API error', error, { module: 'summary-api' });
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = withApiRateLimit(summaryHandler as any, 'metrics')
