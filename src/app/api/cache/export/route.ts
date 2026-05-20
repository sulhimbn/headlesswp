import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

async function cacheExportHandler(_request: NextRequest) {
  try {
    const exportData = cacheManager.exportCache();

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

export const GET = withApiRateLimit(cacheExportHandler, 'cache')
