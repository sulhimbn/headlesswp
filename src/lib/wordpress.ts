import axios from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { apiSecurity } from './api-security';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

const api = axios.create({
  baseURL: WORDPRESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'HeadlessWP-Client/1.0',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for security
api.interceptors.request.use(
  (config) => {
    // Add API key if authentication is enabled
    const apiKey = process.env.WORDPRESS_API_KEY;
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }

    // Validate and sanitize URL parameters
    if (config.params) {
      Object.keys(config.params).forEach(key => {
        if (typeof config.params[key] === 'string') {
          config.params[key] = apiSecurity.sanitizeInput(config.params[key]);
        }
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for security and retry logic
api.interceptors.response.use(
  (response) => {
    // Validate response data for basic security
    if (response.data && typeof response.data === 'object') {
      // Add basic validation to ensure data structure is safe
      Object.keys(response.data).forEach(key => {
        if (typeof response.data[key] === 'string') {
          response.data[key] = apiSecurity.sanitizeInput(response.data[key]);
        }
      });
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
      
      if (!config._rateLimitRetry) {
        config._rateLimitRetry = true;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }
    
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
  
  // Validate API path for security
  if (!apiSecurity.validateAPIPath(path)) {
    throw new Error(`Invalid API path: ${path}`);
  }
  
  return `${baseUrl}/index.php?rest_route=${path}`;
};

// Helper function to validate and sanitize search parameters
const validateSearchParams = (params: any) => {
  const sanitized: any = {};
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      if (typeof params[key] === 'string') {
        sanitized[key] = apiSecurity.sanitizeInput(params[key]);
      } else if (typeof params[key] === 'number') {
        sanitized[key] = Math.max(0, params[key]); // Ensure non-negative numbers
      } else {
        sanitized[key] = params[key];
      }
    }
  });
  
  return sanitized;
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
    const sanitizedParams = params ? validateSearchParams(params) : {};
    // Limit per_page to prevent excessive data requests
    if (sanitizedParams.per_page && sanitizedParams.per_page > 100) {
      sanitizedParams.per_page = 100;
    }
    const response = await api.get(getApiUrl('/wp/v2/posts'), { params: sanitizedParams });
    return response.data;
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const sanitizedSlug = apiSecurity.sanitizeInput(slug);
    if (!sanitizedSlug) {
      throw new Error('Invalid post slug');
    }
    const response = await api.get(getApiUrl('/wp/v2/posts'), { params: { slug: sanitizedSlug } });
    return response.data[0];
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const response = await api.get(getApiUrl(`/wp/v2/posts/${id}`));
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const response = await api.get(getApiUrl('/wp/v2/categories'));
    return response.data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const response = await api.get(getApiUrl('/wp/v2/categories'), { params: { slug } });
    return response.data[0];
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const response = await api.get(getApiUrl('/wp/v2/tags'));
    return response.data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const response = await api.get(getApiUrl('/wp/v2/tags'), { params: { slug } });
    return response.data[0];
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const response = await api.get(getApiUrl(`/wp/v2/media/${id}`));
    return response.data;
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const response = await api.get(getApiUrl(`/wp/v2/users/${id}`));
    return response.data;
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    const sanitizedQuery = apiSecurity.sanitizeInput(query);
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    if (sanitizedQuery.length > 100) {
      throw new Error('Search query too long');
    }
    const response = await api.get(getApiUrl('/wp/v2/search'), { params: { search: sanitizedQuery } });
    return response.data;
  },
};

export default wordpressAPI;