import { createJSONFeedItem, createMainJSONFeed } from '@/lib/utils/jsonFeed';
import type { WordPressPost } from '@/types/wordpress';

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
    categories: [],
    tags: [],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/test-post',
  };

  describe('createJSONFeedItem', () => {
    it('should create JSON Feed item from WordPress post', () => {
      const item = createJSONFeedItem(mockPost);

      expect(item.id).toBe('https://example.com/test-post');
      expect(item.url).toBe('https://example.com/test-post');
      expect(item.title).toBe('Test Post');
      expect(item.content_html).toBe('<p>Content</p>');
      expect(item.content_text).toBe('Content');
      expect(item.date_published).toBe('2026-02-25T10:00:00Z');
      expect(item.date_modified).toBe('2026-02-25T12:00:00Z');
      expect(item.summary).toBe('Excerpt');
    });

    it('should strip HTML from title and content_text', () => {
      const postWithHTML = {
        ...mockPost,
        title: { rendered: '<h1>HTML Title</h1>' },
        content: { rendered: '<div><p>HTML Content</p></div>' },
        excerpt: { rendered: '<div><p>Summary</p></div>' },
      };
      const item = createJSONFeedItem(postWithHTML);

      expect(item.title).toBe('HTML Title');
      expect(item.content_text).toBe('HTML Content');
      expect(item.summary).toBe('Summary');
    });

    it('should handle empty content', () => {
      const postWithEmptyContent = {
        ...mockPost,
        content: { rendered: '' },
        excerpt: { rendered: '' },
      };
      const item = createJSONFeedItem(postWithEmptyContent);

      expect(item.content_html).toBe('');
      expect(item.content_text).toBe('');
      expect(item.summary).toBeUndefined();
    });

    it('should include date_modified only when available', () => {
      const postWithoutModified = {
        ...mockPost,
        modified: '',
      };
      const item = createJSONFeedItem(postWithoutModified);

      expect(item.date_modified).toBeUndefined();
    });
  });

  describe('createMainJSONFeed', () => {
    it('should create main JSON Feed from posts', () => {
      const feed = createMainJSONFeed([mockPost]);

      expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
      expect(feed.title).toBe('Mitra Banten News');
      expect(feed.home_page_url).toBe('https://mitrabantennews.com');
      expect(feed.feed_url).toBe('https://mitrabantennews.com/feed.json');
      expect(feed.description).toBe('Portal berita terkini dan terpercaya dari Banten');
      expect(feed.language).toBe('id');
      expect(feed.items).toHaveLength(1);
      expect(feed.items[0].title).toBe('Test Post');
    });

    it('should limit to 50 posts', () => {
      const posts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: i,
        title: { rendered: `Post ${i}` },
        link: `https://example.com/post-${i}`,
      }));
      const feed = createMainJSONFeed(posts);

      expect(feed.items).toHaveLength(50);
    });

    it('should handle empty posts array', () => {
      const feed = createMainJSONFeed([]);

      expect(feed.title).toBe('Mitra Banten News');
      expect(feed.items).toHaveLength(0);
    });

    it('should have valid JSON Feed 1.1 version URL', () => {
      const feed = createMainJSONFeed([mockPost]);

      expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
    });
  });
});

describe('JSON Feed API Route', () => {
  const mockPost: WordPressPost = {
    id: 1,
    title: { rendered: 'Test Post' },
    content: { rendered: '<p>Content</p>' },
    excerpt: { rendered: '<p>Excerpt</p>' },
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

  describe('JSON Feed Generation', () => {
    it('should generate valid JSON Feed 1.1', () => {
      const feed = createMainJSONFeed([mockPost]);

      expect(feed).toHaveProperty('version');
      expect(feed).toHaveProperty('title');
      expect(feed).toHaveProperty('home_page_url');
      expect(feed).toHaveProperty('feed_url');
      expect(feed).toHaveProperty('items');
      expect(feed.items[0]).toHaveProperty('id');
      expect(feed.items[0]).toHaveProperty('url');
      expect(feed.items[0]).toHaveProperty('title');
      expect(feed.items[0]).toHaveProperty('content_html');
      expect(feed.items[0]).toHaveProperty('content_text');
      expect(feed.items[0]).toHaveProperty('date_published');
    });

    it('should include all required JSON Feed 1.1 fields', () => {
      const feed = createMainJSONFeed([mockPost]);

      expect(feed.version).toMatch(/^https:\/\/jsonfeed\.org\/version\/\d+(\.\d+)?$/);
      expect(typeof feed.title).toBe('string');
      expect(typeof feed.home_page_url).toBe('string');
      expect(typeof feed.feed_url).toBe('string');
      expect(Array.isArray(feed.items)).toBe(true);
    });
  });
});