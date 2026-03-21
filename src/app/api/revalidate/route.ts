import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, cacheKeys } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import { ApiErrorType } from '@/lib/api/errors';

export interface RevalidatePayload {
  post_id: number;
  post_type: 'post' | 'page' | 'attachment';
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

interface RevalidationResult {
  success: boolean;
  postId: number;
  postType: string;
  action: string;
  invalidatedKeys: string[];
  cascadeInvalidations: number;
  timestamp: string;
}

function getRevalidateSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET;
}

const POST_TYPE_TO_CACHE_KEYS: Record<string, (id: number) => string[]> = {
  post: (id: number) => [
    cacheKeys.postById(id),
    `posts:${id}`,
    cacheKeys.posts('default'),
  ],
  page: (id: number) => [
    `page:${id}`,
    `pages:${id}`,
  ],
  attachment: (id: number) => [
    cacheKeys.media(id),
  ],
};

function validateSecret(request: NextRequest): boolean {
  const secret = getRevalidateSecret();
  if (!secret) {
    logger.warn('REVALIDATE_SECRET not configured, allowing all requests', {
      module: 'revalidate'
    });
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const secretHeader = request.headers.get('x-revalidate-secret');

  let providedSecret: string | null = null;
  
  if (secretHeader) {
    providedSecret = secretHeader;
  } else if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      providedSecret = authHeader.slice(7);
    } else {
      providedSecret = authHeader;
    }
  }

  if (!providedSecret) {
    return false;
  }

  return providedSecret === secret;
}

function validatePayload(payload: unknown): payload is RevalidatePayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  if (typeof p.post_id !== 'number' || !Number.isInteger(p.post_id) || p.post_id <= 0) {
    return false;
  }

  if (typeof p.post_type !== 'string' || !['post', 'page', 'attachment'].includes(p.post_type)) {
    return false;
  }

  if (typeof p.action !== 'string' || !['create', 'update', 'delete'].includes(p.action)) {
    return false;
  }

  if (typeof p.timestamp !== 'string') {
    return false;
  }

  const date = new Date(p.timestamp);
  if (isNaN(date.getTime())) {
    return false;
  }

  return true;
}

function invalidateCachesForEntity(
  postId: number,
  postType: RevalidatePayload['post_type'],
  action: RevalidatePayload['action']
): RevalidationResult {
  const invalidatedKeys: string[] = [];

  const cacheKeyGenerator = POST_TYPE_TO_CACHE_KEYS[postType];
  if (!cacheKeyGenerator) {
    logger.warn(`Unknown post type: ${postType}`, { module: 'revalidate' });
    return {
      success: false,
      postId,
      postType,
      action,
      invalidatedKeys: [],
      cascadeInvalidations: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const keysToInvalidate = cacheKeyGenerator(postId);

  const statsBefore = cacheManager.getStats();

  for (const key of keysToInvalidate) {
    const keyExists = cacheManager.get<unknown>(key) !== null;
    if (keyExists) {
      invalidatedKeys.push(key);
    }
    cacheManager.invalidate(key);
  }

  if (action === 'delete' && postType === 'post') {
    cacheManager.invalidateByEntityType('posts');
  }

  const statsAfter = cacheManager.getStats();
  const cascadeInvalidations = statsAfter.cascadeInvalidations - statsBefore.cascadeInvalidations;

  return {
    success: true,
    postId,
    postType,
    action,
    invalidatedKeys,
    cascadeInvalidations,
    timestamp: new Date().toISOString(),
  };
}

async function handleRevalidateRequest(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    return NextResponse.json(
      {
        success: false,
        error: 'Method not allowed. Use POST.',
      },
      { status: 405 }
    );
  }

  if (!validateSecret(request)) {
    logger.warn('Invalid or missing revalidation secret', { module: 'revalidate' });
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized. Invalid or missing secret.',
        type: ApiErrorType.CLIENT_ERROR,
      },
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid JSON payload.',
        type: ApiErrorType.CLIENT_ERROR,
      },
      { status: 400 }
    );
  }

  if (!validatePayload(payload)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid payload. Required fields: post_id (number), post_type (post|page|attachment), action (create|update|delete), timestamp (ISO string).',
        type: ApiErrorType.CLIENT_ERROR,
      },
      { status: 400 }
    );
  }

  const revalidatePayload = payload as RevalidatePayload;

  logger.info(`Revalidation triggered for ${revalidatePayload.post_type}:${revalidatePayload.post_id} (${revalidatePayload.action})`, {
    module: 'revalidate',
    postId: revalidatePayload.post_id,
    postType: revalidatePayload.post_type,
    action: revalidatePayload.action,
  });

  const result = invalidateCachesForEntity(
    revalidatePayload.post_id,
    revalidatePayload.post_type,
    revalidatePayload.action
  );

  if (result.success) {
    logger.info(`Cache invalidation completed: ${result.invalidatedKeys.length} keys invalidated, ${result.cascadeInvalidations} cascade invalidations`, {
      module: 'revalidate',
      invalidatedKeys: result.invalidatedKeys,
      cascadeInvalidations: result.cascadeInvalidations,
    });

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${result.postType}:${result.postId}`,
      data: result,
    });
  } else {
    return NextResponse.json({
      success: false,
      error: `Failed to invalidate cache for ${result.postType}:${result.postId}`,
      data: result,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRevalidateRequest(request);
}
