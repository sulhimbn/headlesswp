import { NextResponse } from 'next/server';
import { standardizedAPI } from '@/lib/api/standardized';
import { isApiResultSuccessful } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';
import { CACHE_TIMES } from '@/lib/api/config';
import { createApiError, ApiErrorType } from '@/lib/api/errors';
import { corsResponse } from '@/lib/api/cors';

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM_SHORT / 1000}, s-maxage=${CACHE_TIMES.MEDIUM_SHORT / 1000}, stale-while-revalidate=${CACHE_TIMES.MEDIUM}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categories = searchParams.get('categories');
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const queryParams: Record<string, string | number> = {
      per_page: perPage,
      page,
    };

    if (categories) {
      queryParams.categories = categories;
    }

    const result = await standardizedAPI.getAllPosts(queryParams);

    if (!isApiResultSuccessful(result) || !result.data) {
      const error =
        result.error ??
        createApiError(new Error('Unknown error'), '/wp/v2/posts');
      logger.warn('Failed to fetch posts from API', error, {
        module: 'api/posts',
      });
      const statusCode =
        error.statusCode ||
        (error.type === ApiErrorType.NETWORK_ERROR ? 503 : 500);
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: statusCode }
      );
    }

    const posts = result.data.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      featured_media: post.featured_media,
      date: post.date,
      categories: post.categories,
      tags: post.tags,
    }));

    const response = corsResponse(NextResponse.json(posts));
    response.headers.set('Cache-Control', CACHE_CONTROL);
    return response;
  } catch (error) {
    const apiError = createApiError(error, '/wp/v2/posts');
    logger.error('Error in /api/posts', apiError, { module: 'api/posts' });
    const statusCode =
      apiError.statusCode ||
      (apiError.type === ApiErrorType.NETWORK_ERROR ? 503 : 500);
    return corsResponse(
      NextResponse.json(
        { error: apiError.message, type: apiError.type },
        { status: statusCode }
      )
    );
  }
}
