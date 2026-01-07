import { ApiError } from './errors';

export interface ApiMetadata {
  timestamp: string;
  endpoint?: string;
  cacheHit?: boolean;
  retryCount?: number;
}

export interface ApiPaginationMetadata {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResult<T> {
  data: T;
  error: ApiError | null;
  metadata: ApiMetadata;
  pagination?: ApiPaginationMetadata;
}

export interface ApiListResult<T> extends ApiResult<T[]> {
  pagination: ApiPaginationMetadata;
}

export function createSuccessResult<T>(
  data: T,
  metadata: Partial<ApiMetadata> = {},
  pagination?: ApiPaginationMetadata
): ApiResult<T> {
  return {
    data,
    error: null,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    },
    pagination
  };
}

export function createErrorResult<T>(
  error: ApiError,
  metadata: Partial<ApiMetadata> = {}
): ApiResult<T> {
  return {
    data: null as unknown as T,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
}

export function isApiResultSuccessful<T>(result: ApiResult<T>): result is ApiResult<T> & { error: null } {
  return result.error === null;
}

export function unwrapApiResult<T>(result: ApiResult<T>): T {
  if (result.error) {
    throw result.error;
  }
  return result.data;
}

export function unwrapApiResultSafe<T>(result: ApiResult<T>, defaultValue: T): T {
  if (result.error) {
    return defaultValue;
  }
  return result.data;
}

export function createSuccessListResult<T>(
  data: T[],
  metadata: Partial<ApiMetadata> = {},
  pagination: ApiPaginationMetadata
): ApiListResult<T> {
  return {
    data,
    error: null,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    },
    pagination
  };
}
