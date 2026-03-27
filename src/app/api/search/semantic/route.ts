import { semanticSearch } from '@/lib/services/semanticSearchService';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '12', 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const result = await semanticSearch(query.trim(), page, perPage);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Semantic search API error', error, { module: 'semanticSearchApi' });
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1, perPage = 12 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await semanticSearch(query.trim(), page, perPage);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Semantic search API POST error', error, { module: 'semanticSearchApi' });
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}
