import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analytics';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

async function analyticsGetHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const path = searchParams.get('path');

    if (path) {
      const pageViews = analyticsService.getPageViewsByPath(path);
      return NextResponse.json({
        success: true,
        data: {
          path,
          views: pageViews.length,
          pageViews: pageViews.slice(-50),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const analytics = analyticsService.getAnalytics(limit);

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function analyticsPostHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, userAgent } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid path parameter',
        },
        { status: 400 }
      );
    }

    analyticsService.trackPageView(path, referrer, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Page view tracked',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track page view',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function analyticsDeleteHandler(_request: NextRequest) {
  try {
    analyticsService.clearAnalytics();

    return NextResponse.json({
      success: true,
      message: 'Analytics cleared',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiRateLimit(analyticsGetHandler, 'metrics')
export const POST = withApiRateLimit(analyticsPostHandler, 'cache')
export const DELETE = withApiRateLimit(analyticsDeleteHandler, 'cache')
