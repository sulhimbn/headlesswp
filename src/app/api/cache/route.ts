import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearCache, exportCache, importCache, type CacheExportData } from '@/lib/cache';
import { cacheWarmer } from '@/lib/services/cacheWarmer';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

async function cacheGetHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'export') {
      try {
        const exportData = exportCache();
        
        return NextResponse.json({
          success: true,
          data: exportData,
          timestamp: new Date().toISOString(),
        });
      } catch (exportError) {
        logger.error('Error exporting cache:', exportError, { module: 'cache' });
        
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

async function cacheImportHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const importData = body as CacheExportData;
    
    if (!importData.version || !importData.exportedAt || !Array.isArray(importData.entries)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid cache export data format',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    const count = importCache(importData);
    
    return NextResponse.json({
      success: true,
      message: `Imported ${count} cache entries`,
      entriesImported: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error importing cache:', error, { module: 'cache' });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiRateLimit(cacheGetHandler, 'cache')
export const POST = withApiRateLimit(cachePostHandler, 'cache')
export const PUT = withApiRateLimit(cacheImportHandler, 'cache')
export const DELETE = withApiRateLimit(cacheDeleteHandler, 'cache')
