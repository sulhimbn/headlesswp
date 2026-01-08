import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { apiClient, getApiUrl } from './api/client';
import { cacheManager, CACHE_TTL, CACHE_KEYS } from './cache';
import { logger } from '@/lib/utils/logger';

export const wordpressAPI = {
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

  getPost: async (slug: string, signal?: AbortSignal): Promise<WordPressPost> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params: { slug }, signal });
    return response.data[0];
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

  getCategory: async (slug: string, signal?: AbortSignal): Promise<WordPressCategory> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/categories'), { params: { slug }, signal });
    return response.data[0];
  },

  // Tags
  getTags: async (signal?: AbortSignal): Promise<WordPressTag[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { signal });
    return response.data;
  },

  getTag: async (slug: string, signal?: AbortSignal): Promise<WordPressTag> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { params: { slug }, signal });
    return response.data[0];
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

    try {
      const response = await apiClient.get(getApiUrl('/wp/v2/media'), { 
        params: { include: idsToFetch.join(',') },
        signal 
      });
      
      const mediaList: WordPressMedia[] = response.data;
      
      for (const media of mediaList) {
        result.set(media.id, media);
        cacheManager.set(CACHE_KEYS.media(media.id), media, CACHE_TTL.MEDIA);
      }
    } catch (error) {
      logger.warn('Failed to fetch media batch', error, { module: 'wordpressAPI' });
    }

    return result;
  },

  getMediaUrl: async (mediaId: number, signal?: AbortSignal): Promise<string | null> => {
    if (mediaId === 0) return null;

    const cacheKey = CACHE_KEYS.media(mediaId);
    const cached = cacheManager.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const media = await wordpressAPI.getMedia(mediaId, signal);
      const url = media.source_url;
      if (url) {
        cacheManager.set(cacheKey, url, CACHE_TTL.MEDIA);
        return url;
      }
      return null;
    } catch (error) {
      logger.warn(`Failed to fetch media ${mediaId}`, error, { module: 'wordpressAPI' });
      return null;
    }
  },

  getMediaUrlsBatch: async (mediaIds: number[], signal?: AbortSignal): Promise<Map<number, string | null>> => {
    const urlMap = new Map<number, string | null>();
    const mediaBatch = await wordpressAPI.getMediaBatch(mediaIds, signal);

    for (const [id, media] of mediaBatch) {
      urlMap.set(id, media.source_url);
    }

    for (const id of mediaIds) {
      if (id === 0) {
        urlMap.set(id, null);
      } else if (!urlMap.has(id)) {
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

  search: async (query: string): Promise<WordPressPost[]> => {
    const cacheKey = CACHE_KEYS.search(query);

    const cached = cacheManager.get<WordPressPost[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/search'), { params: { search: query } });
    const data = response.data;

    cacheManager.set(cacheKey, data, CACHE_TTL.SEARCH);

    return data;
  },

  clearCache: (pattern?: string) => {
    if (pattern) {
      cacheManager.clearPattern(pattern);
    } else {
      cacheManager.clear();
    }
  },

  getCacheStats: () => {
    return cacheManager.getStats();
  },

  warmCache: async () => {
    try {
      const { enhancedPostService } = await import('./services/enhancedPostService');
      const results = await Promise.allSettled([
        wordpressAPI.getPosts({ per_page: 6 }),
        wordpressAPI.getCategories(),
        wordpressAPI.getTags(),
        enhancedPostService.warmCache(),
      ]);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        logger.warn('Cache warming failed', failed[0].reason, { module: 'wordpressAPI' });
      } else {
        logger.info('Cache warming completed', { module: 'wordpressAPI' });
      }
    } catch (error) {
      logger.warn('Cache warming failed', error, { module: 'wordpressAPI' });
    }
  },
};

export default wordpressAPI;