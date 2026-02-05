import type { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor, WordPressSearchResult } from '@/types/wordpress';
import { apiClient, getApiUrl } from './api/client';
import { cacheManager, CACHE_TTL, cacheKeys } from './cache';
import { logger } from '@/lib/utils/logger';
import { cacheFetch } from '@/lib/utils/cacheFetch';
import type { IWordPressAPI } from './api/IWordPressAPI';
import {
  createCollectionMethod,
  createItemMethod,
  createIdMethod,
  createPostsMethod,
  createPostsWithHeadersMethod
} from './api/wpMethodFactory';
import { createBatchOperation } from './api/batchOperations';

export const wordpressAPI: IWordPressAPI = {
  getPostsWithHeaders: createPostsWithHeadersMethod(),

  getPosts: createPostsMethod(),

  getPost: createItemMethod<WordPressPost>({
    endpoint: '/wp/v2/posts'
  }),

  getPostById: async (id: number, signal?: AbortSignal): Promise<WordPressPost> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/posts/${id}`), { signal });
    return response.data;
  },

  getCategories: createCollectionMethod<WordPressCategory>({
    endpoint: '/wp/v2/categories',
    fields: 'id,name,slug'
  }),

  getCategory: createItemMethod<WordPressCategory>({
    endpoint: '/wp/v2/categories',
    fields: 'id,name,slug'
  }),

  getCategoryById: createIdMethod<WordPressCategory>({
    endpoint: '/wp/v2/categories',
    fields: 'id,name,slug'
  }),

  getTags: createCollectionMethod<WordPressTag>({
    endpoint: '/wp/v2/tags',
    fields: 'id,name'
  }),

  getTag: createItemMethod<WordPressTag>({
    endpoint: '/wp/v2/tags',
    fields: 'id,name'
  }),

  getTagById: createIdMethod<WordPressTag>({
    endpoint: '/wp/v2/tags',
    fields: 'id,name'
  }),

  getMedia: async (id: number, signal?: AbortSignal): Promise<WordPressMedia> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/media/${id}`), { signal });
    return response.data;
  },

  getMediaBatch: async (ids: number[], signal?: AbortSignal): Promise<Map<number, WordPressMedia>> => {
    const result = await createBatchOperation<WordPressMedia>({
      ids,
      cacheKeyFn: cacheKeys.media,
      cacheManager,
      cacheTtl: CACHE_TTL.MEDIA,
      fetchFn: async (idsToFetch, signal) => {
        const response = await apiClient.get(getApiUrl('/wp/v2/media'), {
          params: { include: idsToFetch.join(',') },
          signal
        });
        return response.data as WordPressMedia[];
      },
      extractIdFn: (media) => media.id,
      skipZero: true,
      signal
    });

    return result as Map<number, WordPressMedia>;
  },

  getMediaUrl: async (mediaId: number, signal?: AbortSignal): Promise<string | null> => {
    if (mediaId === 0) return null;

    const cacheKey = cacheKeys.media(mediaId);
    const cached = cacheManager.get<string>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(getApiUrl(`/wp/v2/media/${mediaId}`), {
      params: { _fields: 'source_url' },
      signal
    });
    const url = response.data.source_url;
    if (url) {
      cacheManager.set(cacheKey, url, CACHE_TTL.MEDIA);
    }
    return url ?? null;
  },

  getMediaUrlsBatch: async (mediaIds: number[], signal?: AbortSignal): Promise<Map<number, string | null>> => {
    return createBatchOperation<{ id: number; source_url: string }>({
      ids: mediaIds,
      cacheKeyFn: cacheKeys.media,
      cacheManager,
      cacheTtl: CACHE_TTL.MEDIA,
      fetchFn: async (idsToFetch, signal) => {
        const response = await apiClient.get(getApiUrl('/wp/v2/media'), {
          params: {
            include: idsToFetch.join(','),
            _fields: 'id,source_url'
          },
          signal
        });
        return response.data as Array<{ id: number; source_url: string }>;
      },
      extractIdFn: (media) => media.id,
      skipZero: false,
      signal,
      onSuccess: (item, result, cacheManager, cacheKeyFn, cacheTtl) => {
        (result as unknown as Map<number, string | null>).set(item.id, item.source_url);
        (cacheManager as { set: (key: string, value: string, ttl: number) => void }).set(cacheKeyFn(item.id), item.source_url, cacheTtl);
      },
      onError: (error, idsToFetch) => {
        logger.warn('Failed to fetch media batch for URLs', error, { module: 'wordpressAPI', mediaIds: idsToFetch });
      }
    }) as unknown as Promise<Map<number, string | null>>;
  },

  getAuthor: async (id: number, signal?: AbortSignal): Promise<WordPressAuthor> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/users/${id}`), { signal });
    return response.data;
  },

  search: async (query: string, signal?: AbortSignal): Promise<WordPressPost[]> => {
    const cacheKey = cacheKeys.search(query);

    const result = await cacheFetch(
      async () => {
        const searchResponse = await apiClient.get<WordPressSearchResult[]>(
          getApiUrl('/wp/v2/search'),
          { params: { search: query, _fields: 'id,type,subtype' }, signal }
        );

        const searchResults = searchResponse.data;
        
        if (searchResults.length === 0) {
          return [];
        }

        const postIds = searchResults.map((result) => result.id);

        const response = await apiClient.get<WordPressPost[]>(
          getApiUrl('/wp/v2/posts'),
          {
            params: {
              include: postIds.join(','),
              _fields: 'id,title,excerpt,slug,date,modified,featured_media,categories,tags,status,type,link'
            },
            signal
          }
        );

        return response.data as WordPressPost[];
      },
      {
        key: cacheKey,
        ttl: CACHE_TTL.SEARCH,
        transform: (data) => data as WordPressPost[]
      }
    );

    return result ?? [];
  }
};

export default wordpressAPI;
