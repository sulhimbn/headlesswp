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
  }): Promise<WordPressPost[]> => {
    const paramsString = JSON.stringify(params || {});
    const cacheKey = CACHE_KEYS.posts(paramsString);
    
    const cached = cacheManager.get<WordPressPost[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params });
    const data = response.data;
    
    const ttl = params?.search ? CACHE_TTL.SEARCH : CACHE_TTL.POSTS;
    cacheManager.set(cacheKey, data, ttl);
    
    return data;
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const cacheKey = CACHE_KEYS.post(slug);
    
    const cached = cacheManager.get<WordPressPost>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params: { slug } });
    const data = response.data[0];
    
    cacheManager.set(cacheKey, data, CACHE_TTL.POST);
    
    return data;
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const cacheKey = CACHE_KEYS.postById(id);
    
    const cached = cacheManager.get<WordPressPost>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl(`/wp/v2/posts/${id}`));
    const data = response.data;
    
    cacheManager.set(cacheKey, data, CACHE_TTL.POST);
    
    return data;
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const cacheKey = CACHE_KEYS.categories();
    
    const cached = cacheManager.get<WordPressCategory[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/categories'));
    const data = response.data;
    
    cacheManager.set(cacheKey, data, CACHE_TTL.CATEGORIES);
    
    return data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const cacheKey = CACHE_KEYS.category(slug);
    
    const cached = cacheManager.get<WordPressCategory>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/categories'), { params: { slug } });
    const data = response.data[0];
    
    cacheManager.set(cacheKey, data, CACHE_TTL.CATEGORIES);
    
    return data;
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const cacheKey = CACHE_KEYS.tags();
    
    const cached = cacheManager.get<WordPressTag[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/tags'));
    const data = response.data;
    
    cacheManager.set(cacheKey, data, CACHE_TTL.TAGS);
    
    return data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const cacheKey = CACHE_KEYS.tag(slug);
    
    const cached = cacheManager.get<WordPressTag>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { params: { slug } });
    const data = response.data[0];
    
    cacheManager.set(cacheKey, data, CACHE_TTL.TAGS);
    
    return data;
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const cacheKey = CACHE_KEYS.media(id);
    
    const cached = cacheManager.get<WordPressMedia>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl(`/wp/v2/media/${id}`));
    const data = response.data;
    
    cacheManager.set(cacheKey, data, CACHE_TTL.MEDIA);
    
    return data;
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const cacheKey = CACHE_KEYS.author(id);
    
    const cached = cacheManager.get<WordPressAuthor>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(getApiUrl(`/wp/v2/users/${id}`));
    const data = response.data;
    
    cacheManager.set(cacheKey, data, CACHE_TTL.AUTHOR);
    
    return data;
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
      console.log('Cache warming completed');
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },
};

export default wordpressAPI;