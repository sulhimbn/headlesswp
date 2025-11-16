import axios from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { cacheManager, CACHE_TTL, CACHE_KEYS } from './cache';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

const api = axios.create({
  baseURL: WORDPRESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add retry logic for failed requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Retry on network errors or 5xx errors
    if (!config._retry && (!error.response || error.response.status >= 500)) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      
      if (config._retryCount <= 3) {
        // Exponential backoff
        const delay = Math.pow(2, config._retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to use index.php fallback for REST API
const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080';
  return `${baseUrl}/index.php?rest_route=${path}`;
};

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
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressPost[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/posts'), { params });
    const data = response.data;
    
    // Cache the result
    const ttl = params?.search ? CACHE_TTL.SEARCH : CACHE_TTL.POSTS;
    cacheManager.set(cacheKey, data, ttl);
    
    return data;
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const cacheKey = CACHE_KEYS.post(slug);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressPost>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/posts'), { params: { slug } });
    const data = response.data[0];
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.POST);
    
    return data;
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const cacheKey = CACHE_KEYS.postById(id);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressPost>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl(`/wp/v2/posts/${id}`));
    const data = response.data;
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.POST);
    
    return data;
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const cacheKey = CACHE_KEYS.categories();
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressCategory[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/categories'));
    const data = response.data;
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.CATEGORIES);
    
    return data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const cacheKey = CACHE_KEYS.category(slug);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressCategory>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/categories'), { params: { slug } });
    const data = response.data[0];
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.CATEGORIES);
    
    return data;
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const cacheKey = CACHE_KEYS.tags();
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressTag[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/tags'));
    const data = response.data;
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.TAGS);
    
    return data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const cacheKey = CACHE_KEYS.tag(slug);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressTag>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/tags'), { params: { slug } });
    const data = response.data[0];
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.TAGS);
    
    return data;
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const cacheKey = CACHE_KEYS.media(id);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressMedia>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl(`/wp/v2/media/${id}`));
    const data = response.data;
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.MEDIA);
    
    return data;
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const cacheKey = CACHE_KEYS.author(id);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressAuthor>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl(`/wp/v2/users/${id}`));
    const data = response.data;
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.AUTHOR);
    
    return data;
  },

  // Search
search: async (query: string): Promise<WordPressPost[]> => {
    const cacheKey = CACHE_KEYS.search(query);
    
    // Try to get from cache first
    const cached = cacheManager.get<WordPressPost[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const response = await api.get(getApiUrl('/wp/v2/search'), { params: { search: query } });
    const data = response.data;
    
    // Cache the result
    cacheManager.set(cacheKey, data, CACHE_TTL.SEARCH);
    
    return data;
  },

  // Cache management functions
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
      // Warm up commonly accessed data
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