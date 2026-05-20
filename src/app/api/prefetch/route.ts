/**
 * Smart Prefetch API Route
 * 
 * API endpoint for client-side smart cache prefetching.
 * Allows tracking navigation and retrieving predictions.
 * 
 * @route /api/prefetch
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { smartPrefetch } from '@/lib/services/prefetch';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/prefetch
 * 
 * Retrieve prefetch statistics and configuration.
 */
export async function GET() {
  try {
    const stats = smartPrefetch.getStats();
    const config = smartPrefetch.getConfig();
    const pendingTasks = smartPrefetch.getPendingTasksCount();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        config,
        pendingTasks,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Failed to get prefetch stats', error, { module: 'prefetch-api' });
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve prefetch data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prefetch
 * 
 * Track navigation and receive predictions for prefetching.
 * 
 * Body:
 * {
 *   sessionId: string,
 *   pagePath: string,
 *   referrer?: string,
 *   deviceType?: 'desktop' | 'mobile' | 'tablet'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sessionId, 
      pagePath, 
      referrer, 
      deviceType 
    } = body;

    // Validate required fields
    if (!sessionId || !pagePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, pagePath' },
        { status: 400 }
      );
    }

    // Track navigation and get predictions
    const predictions = await smartPrefetch.trackAndPrefetch(
      sessionId,
      pagePath,
      referrer,
      deviceType
    );

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        prefetchedCount: predictions.filter(p => p.confidence >= 0.3).length,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Failed to process prefetch request', error, { module: 'prefetch-api' });
    return NextResponse.json(
      { success: false, error: 'Failed to process prefetch request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prefetch
 * 
 * Clear prefetch queue and reset stats.
 */
export async function DELETE() {
  try {
    smartPrefetch.clearQueue();
    
    return NextResponse.json({
      success: true,
      message: 'Prefetch queue cleared',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to clear prefetch queue', error, { module: 'prefetch-api' });
    return NextResponse.json(
      { success: false, error: 'Failed to clear prefetch queue' },
      { status: 500 }
    );
  }
}
