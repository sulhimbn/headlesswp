import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

const CACHE_VERSION = '1.0';

async function cacheExportHandler(_request: NextRequest) {
  try {
    const result = cacheManager.exportCache();

    return NextResponse.json({
      success: true,
      version: CACHE_VERSION,
      exportedAt: result.exportedAt,
      entryCount: result.entryCount,
      entries: result.entries,
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

export const GET = withApiRateLimit(cacheExportHandler, 'cache')