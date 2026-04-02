import { NextRequest, NextResponse } from 'next/server'
import { pageViewAnalytics } from '@/lib/analytics/pageViewAnalytics'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

interface PageViewPayload {
  path: string
  referrer?: string
  sessionId?: string
  userAgent?: string
  language?: string
  screenWidth?: number
  country?: string
  referer?: string
}

async function trackPageView(request: NextRequest) {
  try {
    const payload: PageViewPayload = await request.json()

    if (!payload.path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    const normalizedPayload = {
      path: payload.path,
      referrer: payload.referrer || payload.referer || '',
      userAgent: payload.userAgent || request.headers.get('user-agent') || '',
      sessionId: payload.sessionId,
      language: payload.language,
      screenWidth: payload.screenWidth,
      country: payload.country
    }

    const event = pageViewAnalytics.trackPageView(normalizedPayload)

    return NextResponse.json(
      { success: true, eventId: event.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Analytics is disabled') {
      return NextResponse.json(
        { error: 'Analytics is disabled' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to track page view', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const POST = withApiRateLimit(trackPageView, 'analytics')