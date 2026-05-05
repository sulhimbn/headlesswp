import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { recommendedPostId, source } = body;

    if (!recommendedPostId || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.warn('[Sync] Recommendation click:', { recommendedPostId, source });

    return NextResponse.json({ success: true, synced: 'recommendation_click' });
  } catch (error) {
    console.error('[Sync] Recommendation click error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}