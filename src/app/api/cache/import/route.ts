import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware';

async function cacheImportHandler(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.entries)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body: expected { entries: [...] }',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const result = cacheManager.importCache(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
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

export const POST = withApiRateLimit(cacheImportHandler, 'cache')