import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { postId, slug, title, categoryIds, tagIds } = body;

    if (!postId || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.warn('[Sync] Reading history:', { postId, slug, title, categoryIds, tagIds });

    return NextResponse.json({ success: true, synced: 'reading_history' });
  } catch (error) {
    console.error('[Sync] Reading history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}