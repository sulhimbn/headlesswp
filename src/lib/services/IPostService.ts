import type { WordPressPost, WordPressCategory, WordPressTag, WordPressAuthor } from '@/types/wordpress';

export interface PostWithMediaUrl extends WordPressPost {
  mediaUrl: string | null;
}

export interface PostWithDetails extends WordPressPost {
  mediaUrl: string | null;
  categoriesDetails: WordPressCategory[];
  tagsDetails: WordPressTag[];
  authorDetails: WordPressAuthor | null;
}

export interface PaginatedPostsResult {
  posts: PostWithMediaUrl[];
  totalPosts: number;
  totalPages: number;
}

export interface IPostService {
  getLatestPosts(): Promise<PostWithMediaUrl[]>;
  getCategoryPosts(): Promise<PostWithMediaUrl[]>;
  getAllPosts(): Promise<PostWithMediaUrl[]>;
  getPaginatedPosts(page?: number, perPage?: number): Promise<PaginatedPostsResult>;
  getPostBySlug(slug: string): Promise<PostWithDetails | null>;
  getPostById(id: number): Promise<PostWithDetails | null>;
  getRelatedPosts(categoryIds: number[], excludeId: number): Promise<PostWithMediaUrl[]>;
  getCategories(): Promise<WordPressCategory[]>;
  getTags(): Promise<WordPressTag[]>;
  searchPosts(query: string, page?: number, perPage?: number): Promise<PaginatedPostsResult>;
  getPostsByCategory(categoryId: number, page?: number, perPage?: number): Promise<PaginatedPostsResult>;
  getPostsByAuthor(authorId: number, page?: number, perPage?: number): Promise<PaginatedPostsResult>;
}
