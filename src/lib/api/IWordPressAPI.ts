import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

export interface IWordPressAPI {
  getPost(slug: string, signal?: AbortSignal): Promise<WordPressPost | null>;
  getPostById(id: number, signal?: AbortSignal): Promise<WordPressPost>;
  getPostsWithHeaders(params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<{
    data: WordPressPost[];
    total: number;
    totalPages: number;
  }>;
  getPosts(params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<WordPressPost[]>;
  search(query: string, signal?: AbortSignal): Promise<WordPressPost[]>;
  
  getCategory(slug: string, signal?: AbortSignal): Promise<WordPressCategory | null>;
  getCategories(signal?: AbortSignal): Promise<WordPressCategory[]>;

  getTag(slug: string, signal?: AbortSignal): Promise<WordPressTag | null>;
  getTags(signal?: AbortSignal): Promise<WordPressTag[]>;
  
  getMedia(id: number, signal?: AbortSignal): Promise<WordPressMedia>;
  getMediaUrl(mediaId: number, signal?: AbortSignal): Promise<string | null>;
  getMediaBatch(ids: number[], signal?: AbortSignal): Promise<Map<number, WordPressMedia>>;
  getMediaUrlsBatch(ids: number[], signal?: AbortSignal): Promise<Map<number, string | null>>;
  
  getAuthor(id: number, signal?: AbortSignal): Promise<WordPressAuthor>;
}
