import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput } from '@/lib/api-security'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 'unknown'
    
    const report = await request.json()
    
    // Sanitize input to prevent injection attacks
    const sanitizedReport = sanitizeInput(report)
    
    // Log CSP violations for monitoring with client info
    console.error('CSP Violation from IP:', clientIP, JSON.stringify(sanitizedReport, null, 2))
    
    // Rate limiting for CSP reports (prevent spam)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    console.error('User-Agent:', userAgent)
    
    // In production, you might want to:
    // - Send to a logging service (Sentry, LogRocket, etc.)
    // - Store in a database for analysis
    // - Send alerts for critical violations
    // - Implement rate limiting per IP for CSP reports
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(sanitizedReport)
    }
    
    const response = NextResponse.json({ success: true })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    
    return response
  } catch (error) {
    console.error('Error processing CSP report:', error)
    return NextResponse.json({ 
      error: 'Failed to process report',
      message: 'Invalid JSON format'
    }, { 
      status: 400,
      headers: {
        'X-Content-Type-Options': 'nosniff'
      }
    })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}