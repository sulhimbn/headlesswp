import { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';

export interface PostWithMediaUrl extends WordPressPost {
  mediaUrl: string | null;
}

export interface PostWithDetails extends WordPressPost {
  mediaUrl: string | null;
  categoriesDetails: WordPressCategory[];
  tagsDetails: WordPressTag[];
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
  getCategories(): Promise<WordPressCategory[]>;
  getTags(): Promise<WordPressTag[]>;
}
