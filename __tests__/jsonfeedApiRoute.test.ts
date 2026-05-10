import { createJSONFeedItem, createMainJSONFeed, createCategoryJSONFeed } from '@/lib/utils/jsonfeed';
import type { WordPressPost, WordPressCategory } from '@/types/wordpress';

describe('JSON Feed API Route', () => {
  const mockPost: WordPressPost = {
    id: 1,
    title: { rendered: 'Test Post' },
    content: { rendered: 'Content' },
    excerpt: { rendered: 'Excerpt' },
    slug: 'test-post',
    date: '2026-02-25T10:00:00Z',
    modified: '2026-02-25T12:00:00Z',
    author: 1,
    featured_media: 0,
    categories: [],
    tags: [],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/test-post',
  };

  const mockCategory: WordPressCategory = {
    id: 1,
    name: 'Technology',
    slug: 'technology',
    description: 'Tech news',
    parent: 0,
    count: 10,
    link: 'https://example.com/category/technology',
  };

  describe('JSON Feed Generation', () => {
    it('should generate main JSON feed correctly', () => {
      const posts = [mockPost];
      const feed = createMainJSONFeed(posts);
      const json = JSON.stringify(feed);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('https://jsonfeed.org/version/1.1');
      expect(parsed.title).toBe('Mitra Banten News');
      expect(parsed.items).toHaveLength(1);
    });

    it('should generate category JSON feed correctly', () => {
      const posts = [mockPost];
      const feed = createCategoryJSONFeed(posts, mockCategory);
      const json = JSON.stringify(feed);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('https://jsonfeed.org/version/1.1');
      expect(parsed.title).toBe('Technology - Mitra Banten News');
      expect(parsed.items).toHaveLength(1);
    });

    it('should return valid JSON for single post', () => {
      const item = createJSONFeedItem(mockPost);
      const feed = createMainJSONFeed([mockPost]);
      const json = JSON.stringify(feed);
      const parsed = JSON.parse(json);

      expect(parsed.items[0].id).toBe('https://example.com/test-post');
      expect(parsed.items[0].url).toBe('https://example.com/test-post');
    });

    it('should handle empty posts for main feed', () => {
      const feed = createMainJSONFeed([]);
      const json = JSON.stringify(feed);
      const parsed = JSON.parse(json);

      expect(parsed.title).toBe('Mitra Banten News');
      expect(parsed.items).toHaveLength(0);
    });

    it('should handle empty posts for category feed', () => {
      const feed = createCategoryJSONFeed([], mockCategory);
      const json = JSON.stringify(feed);
      const parsed = JSON.parse(json);

      expect(parsed.title).toContain('Technology');
      expect(parsed.items).toHaveLength(0);
    });
  });
});
