import type { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor, WordPressSearchResult } from '@/types/wordpress';
import { apiClient, getApiUrl } from './api/client';
import { cacheManager, CACHE_TTL, CACHE_KEYS } from './cache';
import { logger } from '@/lib/utils/logger';
import { cacheFetch } from '@/lib/utils/cacheFetch';
import type { IWordPressAPI } from './api/IWordPressAPI';

export const wordpressAPI: IWordPressAPI = {
  // Posts
  getPostsWithHeaders: async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<{ data: WordPressPost[]; total: number; totalPages: number }> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params, signal });
    const total = parseInt(response.headers['x-wp-total'] || '0', 10);
    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);
    return { data: response.data, total, totalPages };
  },

  getPosts: async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<WordPressPost[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params, signal });
    return response.data;
  },

  getPost: async (slug: string, signal?: AbortSignal): Promise<WordPressPost | null> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params: { slug }, signal });
    return response.data[0] || null;
  },

  getPostById: async (id: number, signal?: AbortSignal): Promise<WordPressPost> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/posts/${id}`), { signal });
    return response.data;
  },

  // Categories
  getCategories: async (signal?: AbortSignal): Promise<WordPressCategory[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/categories'), { signal });
    return response.data;
  },

  getCategory: async (slug: string, signal?: AbortSignal): Promise<WordPressCategory | null> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/categories'), { params: { slug }, signal });
    return response.data[0] || null;
  },

  // Tags
  getTags: async (signal?: AbortSignal): Promise<WordPressTag[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { signal });
    return response.data;
  },

  getTag: async (slug: string, signal?: AbortSignal): Promise<WordPressTag | null> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { params: { slug }, signal });
    return response.data[0] || null;
  },

  // Media
  getMedia: async (id: number, signal?: AbortSignal): Promise<WordPressMedia> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/media/${id}`), { signal });
    return response.data;
  },

  getMediaBatch: async (ids: number[], signal?: AbortSignal): Promise<Map<number, WordPressMedia>> => {
    const result = new Map<number, WordPressMedia>();
    const idsToFetch: number[] = [];

    for (const id of ids) {
      if (id === 0) continue;

      const cacheKey = CACHE_KEYS.media(id);
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
      cacheManager.set(CACHE_KEYS.media(media.id), media, CACHE_TTL.MEDIA);
    }

    return result;
  },

  getMediaUrl: async (mediaId: number, signal?: AbortSignal): Promise<string | null> => {
    if (mediaId === 0) return null;

    const cacheKey = CACHE_KEYS.media(mediaId);
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

    const idsToFetch = mediaIds.filter(id => id !== 0);

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
        }
      } catch (error) {
        logger.warn('Failed to fetch media batch for URLs', error, { module: 'wordpressAPI', mediaIds });
      }
    }

    for (const id of mediaIds) {
      if (!urlMap.has(id)) {
        urlMap.set(id, null);
      }
    }

    return urlMap;
  },

  // Authors
  getAuthor: async (id: number, signal?: AbortSignal): Promise<WordPressAuthor> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/users/${id}`), { signal });
    return response.data;
  },

  search: async (query: string, signal?: AbortSignal): Promise<WordPressPost[]> => {
    const cacheKey = CACHE_KEYS.search(query);

    const result = await cacheFetch(
      async () => {
        const searchResponse = await apiClient.get<WordPressSearchResult[]>(
          getApiUrl('/wp/v2/search'),
          { params: { search: query }, signal }
        );

        const searchResults = searchResponse.data;
        const postIds = searchResults.map((result) => result.id);

        const posts = await Promise.all(
          postIds.map((id) => wordpressAPI.getPostById(id, signal))
        );

        return posts.filter((post): post is WordPressPost => post !== null);
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