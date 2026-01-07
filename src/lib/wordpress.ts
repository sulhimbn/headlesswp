import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { apiClient, getApiUrl } from './api/client';
import { cacheManager, CACHE_TTL, CACHE_KEYS } from './cache';

export const wordpressAPI = {
  // Posts
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
      console.warn(`Failed to fetch media ${mediaId}:`, error);
      return null;
    }
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
      await Promise.all([
        wordpressAPI.getPosts({ per_page: 6 }),
        wordpressAPI.getCategories(),
        wordpressAPI.getTags(),
      ]);
      console.warn('Cache warming completed');
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },
};

export default wordpressAPI;