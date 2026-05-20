import { NextResponse } from 'next/server';
import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer';
import { wordpressAPI } from '@/lib/wordpress';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
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