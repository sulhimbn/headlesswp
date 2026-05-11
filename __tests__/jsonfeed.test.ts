import {
  createJSONFeedItem,
  createMainJSONFeed,
  createCategoryJSONFeed,
} from '@/lib/utils/jsonfeed';
import type { WordPressPost, WordPressCategory } from '@/types/wordpress';

describe('JSON Feed Utility Functions', () => {
  const mockPost: WordPressPost = {
    id: 1,
    title: { rendered: '<b>Test Post</b>' },
    content: { rendered: '<p>Content</p>' },
    excerpt: { rendered: '<p>Excerpt</p>' },
    slug: 'test-post',
    date: '2026-02-25T10:00:00Z',
    modified: '2026-02-25T12:00:00Z',
    author: 1,
    featured_media: 0,
    categories: [1],
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

  describe('createJSONFeedItem', () => {
    it('should create JSON Feed item from WordPress post', () => {
      const item = createJSONFeedItem(mockPost);

      expect(item.id).toBe('https://example.com/test-post');
      expect(item.url).toBe('https://example.com/test-post');
      expect(item.title).toBe('Test Post');
      expect(item.content_html).toBe('<p>Content</p>');
      expect(item.date_modified).toBe('2026-02-25T12:00:00.000Z');
      expect(item.date_published).toBe('2026-02-25T10:00:00.000Z');
    });

    it('should strip HTML from title', () => {
      const postWithHTML = {
        ...mockPost,
        title: { rendered: '<h1>HTML Title</h1>' },
      };
      const item = createJSONFeedItem(postWithHTML);

      expect(item.title).toBe('HTML Title');
    });

    it('should preserve HTML in content_html', () => {
      const postWithHTML = {
        ...mockPost,
        content: { rendered: '<div><p>HTML Content</p></div>' },
      };
      const item = createJSONFeedItem(postWithHTML);

      expect(item.content_html).toBe('<div><p>HTML Content</p></div>');
    });

    it('should handle empty title', () => {
      const postWithEmptyTitle = {
        ...mockPost,
        title: { rendered: '' },
      };
      const item = createJSONFeedItem(postWithEmptyTitle);

      expect(item.title).toBe('');
    });
  });

  describe('createMainJSONFeed', () => {
    it('should create main JSON feed from posts', () => {
      const posts = [mockPost];
      const feed = createMainJSONFeed(posts);

      expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
      expect(feed.title).toBe('Mitra Banten News');
      expect(feed.home_page_url).toBeDefined();
      expect(feed.feed_url).toContain('/api/feed.json');
      expect(feed.description).toBe('Portal berita terkini dan terpercaya dari Banten');
      expect(feed.items).toHaveLength(1);
      expect(feed.items[0].title).toBe('Test Post');
    });

    it('should limit to 50 posts', () => {
      const posts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: i,
        title: { rendered: `Post ${i}` },
      }));
      const feed = createMainJSONFeed(posts);

      expect(feed.items).toHaveLength(50);
    });

    it('should handle empty posts array', () => {
      const feed = createMainJSONFeed([]);

      expect(feed.title).toBe('Mitra Banten News');
      expect(feed.items).toHaveLength(0);
    });

    it('should produce valid JSON', () => {
      const posts = [mockPost];
      const feed = createMainJSONFeed(posts);
      const json = JSON.stringify(feed);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all required JSON Feed 1.1 fields', () => {
      const posts = [mockPost];
      const feed = createMainJSONFeed(posts);
      const parsed = JSON.parse(JSON.stringify(feed));

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('title');
      expect(parsed).toHaveProperty('home_page_url');
      expect(parsed).toHaveProperty('feed_url');
      expect(parsed).toHaveProperty('items');
      expect(parsed.items[0]).toHaveProperty('id');
      expect(parsed.items[0]).toHaveProperty('url');
      expect(parsed.items[0]).toHaveProperty('title');
      expect(parsed.items[0]).toHaveProperty('content_html');
      expect(parsed.items[0]).toHaveProperty('date_modified');
    });
  });

  describe('createCategoryJSONFeed', () => {
    it('should create category JSON feed', () => {
      const posts = [mockPost];
      const feed = createCategoryJSONFeed(posts, mockCategory);

      expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
      expect(feed.title).toBe('Technology - Mitra Banten News');
      expect(feed.home_page_url).toBe('https://example.com/category/technology');
      expect(feed.feed_url).toContain('category=technology');
      expect(feed.description).toBe('Berita terkini dalam kategori Technology');
      expect(feed.items).toHaveLength(1);
    });

    it('should limit to 50 posts', () => {
      const posts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: i,
        title: { rendered: `Post ${i}` },
      }));
      const feed = createCategoryJSONFeed(posts, mockCategory);

      expect(feed.items).toHaveLength(50);
    });

    it('should handle empty posts array', () => {
      const feed = createCategoryJSONFeed([], mockCategory);

      expect(feed.items).toHaveLength(0);
    });

    it('should produce valid JSON', () => {
      const posts = [mockPost];
      const feed = createCategoryJSONFeed(posts, mockCategory);
      const json = JSON.stringify(feed);

      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});
