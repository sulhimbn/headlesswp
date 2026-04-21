import { NextResponse } from 'next/server';
import { standardizedAPI } from '@/lib/api/standardized';
import { isApiResultSuccessful } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';
import { createApiError, ApiErrorType } from '@/lib/api/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id, 10);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'Invalid media ID: must be a valid number' },
        { status: 400 }
      );
    }

    const result = await standardizedAPI.getMediaById(mediaId);

    if (!isApiResultSuccessful(result) || !result.data) {
      const error =
        result.error ??
        createApiError(new Error('Unknown error'), '/wp/v2/media');
      logger.warn('Failed to fetch media from API', error, {
        module: 'api/media',
      });
      const statusCode =
        error.statusCode ||
        (error.type === ApiErrorType.NETWORK_ERROR ? 503 : 500);
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    });
  } catch (error) {
    const apiError = createApiError(error, '/wp/v2/media');
    logger.error('Error in /api/media/[id]', apiError, { module: 'api/media' });
    const statusCode =
      apiError.statusCode ||
      (apiError.type === ApiErrorType.NETWORK_ERROR ? 503 : 500);
    return NextResponse.json(
      { error: apiError.message, type: apiError.type },
      { status: statusCode }
    );
  }
}
