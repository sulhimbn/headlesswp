import { wordpressAPI } from '@/lib/wordpress';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressPostWithDetails } from '@/types/wordpress';
import { PAGINATION_LIMITS } from '@/lib/api/config';
import { cacheManager, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { dataValidator } from '@/lib/validation/dataValidator';

interface PostWithMediaUrl extends WordPressPost {
  mediaUrl: string | null;
}

interface PostWithDetails extends WordPressPost {
  mediaUrl: string | null;
  categoriesDetails: WordPressCategory[];
  tagsDetails: WordPressTag[];
}

function createFallbackPost(id: string, title: string): WordPressPost {
  return {
    id: parseInt(id),
    title: { rendered: title },
    content: { rendered: '<p>Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.</p>' },
    excerpt: { rendered: 'Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.' },
    slug: `fallback-${id}`,
    date: new Date().toISOString(),
    modified: new Date().toISOString(),
    author: 0,
    featured_media: 0,
    categories: [],
    tags: [],
    status: 'publish',
    type: 'post',
    link: ''
  };
}

async function getCategoriesMap(): Promise<Map<number, WordPressCategory>> {
  const cacheKey = CACHE_KEYS.categories();
  const cached = cacheManager.get<Map<number, WordPressCategory>>(cacheKey);
  if (cached) return cached;

  try {
    const categories = await wordpressAPI.getCategories();
    const validation = dataValidator.validateCategories(categories);

    if (!validation.valid) {
      console.error('Invalid categories data:', validation.errors);
      return new Map();
    }

    const map = new Map<number, WordPressCategory>(validation.data!.map((cat: WordPressCategory) => [cat.id, cat]));
    cacheManager.set(cacheKey, map, CACHE_TTL.CATEGORIES);
    return map;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return new Map();
  }
}

async function getTagsMap(): Promise<Map<number, WordPressTag>> {
  const cacheKey = CACHE_KEYS.tags();
  const cached = cacheManager.get<Map<number, WordPressTag>>(cacheKey);
  if (cached) return cached;

  try {
    const tags = await wordpressAPI.getTags();
    const validation = dataValidator.validateTags(tags);

    if (!validation.valid) {
      console.error('Invalid tags data:', validation.errors);
      return new Map();
    }

    const map = new Map<number, WordPressTag>(validation.data!.map((tag: WordPressTag) => [tag.id, tag]));
    cacheManager.set(cacheKey, map, CACHE_TTL.TAGS);
    return map;
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return new Map();
  }
}

async function enrichPostsWithMediaUrls(posts: WordPressPost[]): Promise<PostWithMediaUrl[]> {
  const mediaIds = [...new Set(posts.map(post => post.featured_media).filter(id => id > 0))];
  const mediaUrls = await wordpressAPI.getMediaUrlsBatch(mediaIds);

  return posts.map(post => ({
    ...post,
    mediaUrl: mediaUrls.get(post.featured_media) || null
  }));
}

async function enrichPostWithDetails(post: WordPressPost): Promise<PostWithDetails> {
  const [mediaUrl, categoriesMap, tagsMap] = await Promise.all([
    wordpressAPI.getMediaUrl(post.featured_media),
    getCategoriesMap(),
    getTagsMap()
  ]);

  const categoriesDetails = post.categories
    .map(id => categoriesMap.get(id))
    .filter((cat): cat is WordPressCategory => cat !== undefined);

  const tagsDetails = post.tags
    .map(id => tagsMap.get(id))
    .filter((tag): tag is WordPressTag => tag !== undefined);

  return {
    ...post,
    mediaUrl,
    categoriesDetails,
    tagsDetails
  };
}

export const enhancedPostService = {
  getLatestPosts: async (): Promise<PostWithMediaUrl[]> => {
    try {
      const posts = await wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.LATEST_POSTS });
      const validation = dataValidator.validatePosts(posts);

      if (!validation.valid) {
        console.error('Invalid posts data:', validation.errors);
        return [
          createFallbackPost('1', 'Berita Utama 1'),
          createFallbackPost('2', 'Berita Utama 2'),
          createFallbackPost('3', 'Berita Utama 3')
        ].map(post => ({ ...post, mediaUrl: null }));
      }

      return enrichPostsWithMediaUrls(validation.data!);
    } catch (error) {
      console.warn('Failed to fetch latest posts during build:', error);
      return [
        createFallbackPost('1', 'Berita Utama 1'),
        createFallbackPost('2', 'Berita Utama 2'),
        createFallbackPost('3', 'Berita Utama 3')
      ].map(post => ({ ...post, mediaUrl: null }));
    }
  },

  getCategoryPosts: async (): Promise<PostWithMediaUrl[]> => {
    try {
      const posts = await wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.CATEGORY_POSTS });
      const validation = dataValidator.validatePosts(posts);

      if (!validation.valid) {
        console.error('Invalid posts data:', validation.errors);
        return [
          createFallbackPost('cat-1', 'Berita Kategori 1'),
          createFallbackPost('cat-2', 'Berita Kategori 2'),
          createFallbackPost('cat-3', 'Berita Kategori 3')
        ].map(post => ({ ...post, mediaUrl: null }));
      }

      return enrichPostsWithMediaUrls(validation.data!);
    } catch (error) {
      console.warn('Failed to fetch category posts during build:', error);
      return [
        createFallbackPost('cat-1', 'Berita Kategori 1'),
        createFallbackPost('cat-2', 'Berita Kategori 2'),
        createFallbackPost('cat-3', 'Berita Kategori 3')
      ].map(post => ({ ...post, mediaUrl: null }));
    }
  },

  getAllPosts: async (): Promise<PostWithMediaUrl[]> => {
    try {
      const posts = await wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.ALL_POSTS });
      const validation = dataValidator.validatePosts(posts);

      if (!validation.valid) {
        console.error('Invalid posts data:', validation.errors);
        return [];
      }

      return enrichPostsWithMediaUrls(validation.data!);
    } catch (error) {
      console.warn('Failed to fetch all posts during build:', error);
      return [];
    }
  },

  getPostBySlug: async (slug: string): Promise<PostWithDetails | null> => {
    try {
      const post = await wordpressAPI.getPost(slug);

      if (!post) return null;

      const validation = dataValidator.validatePost(post);

      if (!validation.valid) {
        console.error(`Invalid post data for slug ${slug}:`, validation.errors);
        return null;
      }

      return enrichPostWithDetails(validation.data!);
    } catch (error) {
      console.error(`Error fetching post with slug ${slug}:`, error);
      return null;
    }
  },

  getPostById: async (id: number): Promise<PostWithDetails | null> => {
    try {
      const post = await wordpressAPI.getPostById(id);
      const validation = dataValidator.validatePost(post);

      if (!validation.valid) {
        console.error(`Invalid post data for id ${id}:`, validation.errors);
        return null;
      }

      return enrichPostWithDetails(validation.data!);
    } catch (error) {
      console.error(`Error fetching post with id ${id}:`, error);
      return null;
    }
  },

  getCategories: async (): Promise<WordPressCategory[]> => {
    const map = await getCategoriesMap();
    return Array.from(map.values());
  },

  getTags: async (): Promise<WordPressTag[]> => {
    const map = await getTagsMap();
    return Array.from(map.values());
  }
};

export default enhancedPostService;
