import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, any>,
    error: undefined as string | undefined,
  }

  try {
    // Check WordPress API connectivity
    const wordpressUrl = process.env.WORDPRESS_URL || 'http://localhost:8080'
    const apiCheck = await checkWordPressAPI(wordpressUrl)
    healthStatus.checks.wordpress = apiCheck

    // Check memory usage
    healthStatus.checks.memory = {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      unit: 'MB',
    }

    // Check response time
    const responseTime = Date.now() - startTime
    healthStatus.checks.responseTime = {
      value: responseTime,
      unit: 'ms',
      status: responseTime < 1000 ? 'ok' : 'slow',
    }

    // Overall status determination
    const allChecksOk = Object.values(healthStatus.checks).every(
      check => typeof check === 'object' && check.status === 'ok'
    )
    
    healthStatus.status = allChecksOk ? 'ok' : 'degraded'

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === 'ok' ? 200 : 503,
    })

  } catch (error) {
    healthStatus.status = 'error'
    healthStatus.error = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(healthStatus, {
      status: 503,
    })
  }
}

async function checkWordPressAPI(wordpressUrl: string) {
  try {
    const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts?per_page=1`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    return {
      status: response.ok ? 'ok' : 'error',
      responseTime: response.headers.get('x-response-time') || 'unknown',
      statusCode: response.status,
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}