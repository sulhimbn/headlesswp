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
    const result = new Map<number, WordPressMedia>();
    const idsToFetch: number[] = [];

    for (const id of ids) {
      if (id === 0) continue;

      const cacheKey = cacheKeys.media(id);
      const cached = cacheManager.get<WordPressMedia>(cacheKey);
      if (cached) {
        result.set(id, cached);
      } else {
        idsToFetch.push(id);
      }
    }

    if (idsToFetch.length === 0) return result;

    const response = await apiClient.get(getApiUrl('/wp/v2/media'), { 
      params: { include: idsToFetch.join(',') },
      signal 
    });
    
    const mediaList: WordPressMedia[] = response.data;
    
    for (const media of mediaList) {
      result.set(media.id, media);
      cacheManager.set(cacheKeys.media(media.id), media, CACHE_TTL.MEDIA);
    }

    return result;
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
    const urlMap = new Map<number, string | null>();
    const idsToFetch: number[] = [];

    for (const id of mediaIds) {
      if (id === 0) {
        urlMap.set(id, null);
        continue;
      }

      const cacheKey = cacheKeys.media(id);
      const cached = cacheManager.get<string>(cacheKey);
      if (cached) {
        urlMap.set(id, cached);
      } else {
        idsToFetch.push(id);
      }
    }

    if (idsToFetch.length > 0) {
      try {
        const response = await apiClient.get(getApiUrl('/wp/v2/media'), {
          params: {
            include: idsToFetch.join(','),
            _fields: 'id,source_url'
          },
          signal
        });

        const mediaList: Array<{ id: number; source_url: string }> = response.data;

        for (const media of mediaList) {
          urlMap.set(media.id, media.source_url);
          cacheManager.set(cacheKeys.media(media.id), media.source_url, CACHE_TTL.MEDIA);
        }
      } catch (error) {
        logger.warn('Failed to fetch media batch for URLs', error, { module: 'wordpressAPI', mediaIds: idsToFetch });
      }
    }

    for (const id of idsToFetch) {
      if (!urlMap.has(id)) {
        urlMap.set(id, null);
      }
    }

    return urlMap;
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
