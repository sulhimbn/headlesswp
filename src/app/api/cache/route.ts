import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearCache, exportCache, importCache } from '@/lib/cache';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

async function cacheGetHandler(_request: NextRequest) {
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

async function cachePostHandler(_request: NextRequest) {
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

async function cacheExportHandler(_request: NextRequest) {
  try {
    const exportData = exportCache();
    
    return NextResponse.json({
      success: true,
      data: exportData,
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

async function cacheImportHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, mode } = body;
    
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid import data: expected object with entries and metadata',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const result = importCache(data, { mode: mode || 'merge' });
    
    return NextResponse.json({
      success: result.failed === 0,
      message: `Imported ${result.success} entries, failed ${result.failed}`,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error importing cache:', error, { module: 'cache' });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiRateLimit(cacheGetHandler, 'cache')
export const POST = withApiRateLimit(cachePostHandler, 'cache')
export const DELETE = withApiRateLimit(cacheDeleteHandler, 'cache')
export const PUT = withApiRateLimit(cacheImportHandler, 'cache')
export const PATCH = withApiRateLimit(cacheExportHandler, 'cache')
