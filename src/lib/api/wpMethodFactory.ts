import { apiClient, getApiUrl } from './client';
import type { WordPressPost } from '@/types/wordpress';
import { logger } from '@/lib/utils/logger';

interface BaseMethodOptions {
  endpoint: string;
  fields?: string;
}

interface CollectionMethodOptions<T> extends BaseMethodOptions {
  transform?: (data: unknown[]) => T[];
}

interface ItemMethodOptions<T> extends BaseMethodOptions {
  transform?: (data: unknown) => T | null;
}

interface IdMethodOptions<T> extends BaseMethodOptions {
  transform?: (data: unknown) => T | null;
}

export function createCollectionMethod<T>(
  options: CollectionMethodOptions<T>
): (signal?: AbortSignal) => Promise<T[]> {
  return async (signal?: AbortSignal): Promise<T[]> => {
    const response = await apiClient.get(getApiUrl(options.endpoint), {
      params: options.fields ? { _fields: options.fields } : {},
      signal
    });
    return options.transform ? options.transform(response.data) : response.data;
  };
}

export function createItemMethod<T>(
  options: ItemMethodOptions<T>
): (slug: string, signal?: AbortSignal) => Promise<T | null> {
  return async (slug: string, signal?: AbortSignal): Promise<T | null> => {
    const response = await apiClient.get(getApiUrl(options.endpoint), {
      params: {
        slug,
        ...(options.fields ? { _fields: options.fields } : {})
      },
      signal
    });
    return options.transform ? options.transform(response.data) : response.data[0] || null;
  };
}

export function createIdMethod<T>(
  options: IdMethodOptions<T>
): (id: number, signal?: AbortSignal) => Promise<T | null> {
  return async (id: number, signal?: AbortSignal): Promise<T | null> => {
    try {
      const response = await apiClient.get(getApiUrl(`${options.endpoint}/${id}`), {
        params: options.fields ? { _fields: options.fields } : {},
        signal
      });
      return options.transform ? options.transform(response.data) : response.data;
    } catch (error) {
      logger.warn(`Failed to fetch ${options.endpoint.slice(1)}/${id}`, error, { module: 'wpMethodFactory', id });
      return null;
    }
  };
}

export function createPostsMethod(): (params?: {
  page?: number;
  per_page?: number;
  category?: number;
  tag?: number;
  search?: string;
}, signal?: AbortSignal) => Promise<WordPressPost[]> {
  return async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<WordPressPost[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params, signal });
    return response.data;
  };
}

export function createPostsWithHeadersMethod(): (params?: {
  page?: number;
  per_page?: number;
  category?: number;
  tag?: number;
  search?: string;
}, signal?: AbortSignal) => Promise<{ data: WordPressPost[]; total: number; totalPages: number }> {
  return async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<{ data: WordPressPost[]; total: number; totalPages: number }> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { 
      params: {
        ...params,
        _fields: 'id,title,excerpt,slug,date,modified,featured_media,categories,tags,status,type,link'
      },
      signal 
    });
    const total = parseInt(response.headers['x-wp-total'] || '0', 10);
    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);
    return { data: response.data, total, totalPages };
  };
}
