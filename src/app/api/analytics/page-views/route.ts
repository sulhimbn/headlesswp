import { NextRequest, NextResponse } from 'next/server'
import { pageViewAnalytics } from '@/lib/analytics/pageViewAnalytics'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function getPageViews(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7'
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    
    const periodDays = Math.min(parseInt(period, 10) || 7, 90)
    const clampedLimit = Math.min(limit, 1000)
    
    const stats = pageViewAnalytics.getStats(periodDays)
    
    const events = pageViewAnalytics.getEvents()
    const periodStart = Date.now() - periodDays * 24 * 60 * 60 * 1000
    const recentEvents = events
      .filter(e => new Date(e.timestamp).getTime() >= periodStart)
      .slice(-clampedLimit)

    return NextResponse.json({
      summary: stats,
      events: recentEvents.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        path: e.path,
        referrer: e.referrer,
        sessionId: e.sessionId,
        browser: e.browser,
        device: e.device,
        timeOnPage: e.timeOnPage
      }))
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get page views', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const GET = withApiRateLimit(getPageViews, 'analytics')