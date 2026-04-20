import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearCache } from '@/lib/cache';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';
import { corsHeaders, handleCorsPreflight } from '@/lib/api/cors';

async function cacheGetHandler(request: NextRequest) {
  const preflight = handleCorsPreflight(request)
  if (preflight) {
    return preflight
  }

  try {
    const stats = getCacheStats();

    return corsHeaders(request, NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Error fetching cache stats:', error, { module: 'cache' });
    
    return corsHeaders(request, NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cache statistics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    ));
  }
}

async function cachePostHandler(request: NextRequest) {
  const preflight = handleCorsPreflight(request)
  if (preflight) {
    return preflight
  }

  try {
    const result = await cacheWarmer.warmAll();
    
    return corsHeaders(request, NextResponse.json({
      success: true,
      message: 'Cache warming completed',
      data: result,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Error warming cache:', error, { module: 'cache' });
    
    return corsHeaders(request, NextResponse.json(
      {
        success: false,
        error: 'Failed to warm cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    ));
  }
}

async function cacheDeleteHandler(request: NextRequest) {
  const preflight = handleCorsPreflight(request)
  if (preflight) {
    return preflight
  }

  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');
    
    clearCache(pattern || undefined);
    
    return corsHeaders(request, NextResponse.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared',
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Error clearing cache:', error, { module: 'cache' });
    
    return corsHeaders(request, NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    ));
  }
}

export const GET = withApiRateLimit(cacheGetHandler, 'cache')
export const POST = withApiRateLimit(cachePostHandler, 'cache')
export const DELETE = withApiRateLimit(cacheDeleteHandler, 'cache')
