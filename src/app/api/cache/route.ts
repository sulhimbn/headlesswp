import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearCache, exportCacheData, importCacheData } from '@/lib/cache';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

function getCacheSecret(): string | undefined {
  return process.env.CACHE_SECRET;
}

function validateCacheSecret(request: NextRequest): boolean {
  const CACHE_SECRET = getCacheSecret();
  
  if (!CACHE_SECRET) {
    logger.warn('CACHE_SECRET not configured - denying access', { module: 'cache' });
    return false;
  }
  
  const authHeader = request.headers.get('x-cache-secret');
  return authHeader === CACHE_SECRET;
}

async function cacheGetHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'export') {
    if (!validateCacheSecret(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - CACHE_SECRET required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    try {
      const data = exportCacheData();

      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error exporting cache:', error, { module: 'cache' });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to export cache',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }

  try {
    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching cache stats:', error, { module: 'cache' });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cache statistics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function cachePostHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'import') {
    if (!validateCacheSecret(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - CACHE_SECRET required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    try {
      const body = await request.json();
      const { data, merge } = body;

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing cache data in request body',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      const result = importCacheData(data, merge !== false);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to import cache',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Cache imported: ${result.imported} entries`,
        imported: result.imported,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error importing cache:', error, { module: 'cache' });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to import cache - invalid JSON',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  }

  try {
    const result = await cacheWarmer.warmAll();
    
    return NextResponse.json({
      success: true,
      message: 'Cache warming completed',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error warming cache:', error, { module: 'cache' });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to warm cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function cacheDeleteHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');
    
    clearCache(pattern || undefined);
    
    return NextResponse.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error clearing cache:', error, { module: 'cache' });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiRateLimit(cacheGetHandler, 'cache')
export const POST = withApiRateLimit(cachePostHandler, 'cache')
export const DELETE = withApiRateLimit(cacheDeleteHandler, 'cache')
