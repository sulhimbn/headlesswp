import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function cspReportHandler(request: NextRequest) {
  try {
    const report = await request.json()

    logger.error('CSP Violation:', JSON.stringify(report, null, 2))
    
    // In production, you might want to:
    // - Send to a logging service (Sentry, LogRocket, etc.)
    // - Store in a database for analysis
    // - Send alerts for critical violations
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(report)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error processing CSP report:', error)
    return NextResponse.json({ error: 'Failed to process report' }, { status: 400 })
  }
}

export const POST = withApiRateLimit(cspReportHandler, 'cspReport')
