import {
  createRSSItem,
  createRSSFeed,
  createMainRSSFeed,
  createCategoryRSSFeed,
} from '@/lib/utils/rss';
import type { WordPressPost, WordPressCategory } from '@/types/wordpress';

describe('RSS Utility Functions', () => {
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

  describe('createRSSItem', () => {
    it('should create RSS item from WordPress post', () => {
      const item = createRSSItem(mockPost);

      expect(item.title).toBe('Test Post');
      expect(item.link).toBe('https://example.com/test-post');
      expect(item.description).toBe('Excerpt');
      expect(item.guid).toBe('https://example.com/test-post');
      expect(item.pubDate).toContain('Feb');
      expect(item.pubDate).toContain('2026');
    });

    it('should strip HTML from title and description', () => {
      const postWithHTML = {
        ...mockPost,
        title: { rendered: '<h1>HTML Title</h1>' },
        excerpt: { rendered: '<div><p>HTML Excerpt</p></div>' },
      };
      const item = createRSSItem(postWithHTML);

      expect(item.title).toBe('HTML Title');
      expect(item.description).toBe('HTML Excerpt');
    });

    it('should handle empty title', () => {
      const postWithEmptyTitle = {
        ...mockPost,
        title: { rendered: '' },
      };
      const item = createRSSItem(postWithEmptyTitle);

      expect(item.title).toBe('');
    });
  });

  describe('createRSSFeed', () => {
    it('should generate valid RSS XML', () => {
      const feed = {
        title: 'Test Feed',
        link: 'https://example.com',
        description: 'Test description',
        language: 'en',
        pubDate: 'Sun, 25 Feb 2026 10:00:00 +0000',
        items: [createRSSItem(mockPost)],
      };

      const xml = createRSSFeed(feed);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<rss version="2.0"');
      expect(xml).toContain('<title>Test Feed</title>');
      expect(xml).toContain('<link>https://example.com</link>');
      expect(xml).toContain('<description>Test description</description>');
      expect(xml).toContain('<item>');
      expect(xml).toContain('</item>');
    });

    it('should escape XML special characters', () => {
      const postWithSpecialChars: WordPressPost = {
        ...mockPost,
        title: { rendered: 'Test & News' },
        excerpt: { rendered: 'Description with "quotes"' },
      };

      const feed = {
        title: 'Feed & Title',
        link: 'https://example.com',
        description: 'Description',
        language: 'en',
        pubDate: 'Sun, 25 Feb 2026 10:00:00 +0000',
        items: [createRSSItem(postWithSpecialChars)],
      };

      const xml = createRSSFeed(feed);

      expect(xml).toContain('&amp;');
    });

    it('should include categories in items', () => {
      const item = createRSSItem(mockPost);
      item.categories = ['Technology', 'News'];

      const feed = {
        title: 'Test Feed',
        link: 'https://example.com',
        description: 'Test description',
        language: 'en',
        pubDate: 'Sun, 25 Feb 2026 10:00:00 +0000',
        items: [item],
      };

      const xml = createRSSFeed(feed);

      expect(xml).toContain('<category>Technology</category>');
      expect(xml).toContain('<category>News</category>');
    });

    it('should handle empty items array', () => {
      const feed = {
        title: 'Empty Feed',
        link: 'https://example.com',
        description: 'No items',
        language: 'en',
        pubDate: 'Sun, 25 Feb 2026 10:00:00 +0000',
        items: [],
      };

      const xml = createRSSFeed(feed);

      expect(xml).toContain('<channel>');
      expect(xml).toContain('</channel>');
      expect(xml).not.toContain('<item>');
    });
  });

  describe('createMainRSSFeed', () => {
    it('should create main RSS feed from posts', () => {
      const posts = [mockPost];
      const feed = createMainRSSFeed(posts);

      expect(feed.title).toBe('Mitra Banten News');
      expect(feed.language).toBe('id');
      expect(feed.items).toHaveLength(1);
      expect(feed.items[0].title).toBe('Test Post');
    });

    it('should limit to 50 posts', () => {
      const posts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: i,
        title: { rendered: `Post ${i}` },
      }));
      const feed = createMainRSSFeed(posts);

      expect(feed.items).toHaveLength(50);
    });

    it('should handle empty posts array', () => {
      const feed = createMainRSSFeed([]);

      expect(feed.title).toBe('Mitra Banten News');
      expect(feed.items).toHaveLength(0);
      expect(feed.pubDate).toContain('2026');
    });
  });

  describe('createCategoryRSSFeed', () => {
    it('should create category RSS feed', () => {
      const posts = [mockPost];
      const feed = createCategoryRSSFeed(posts, mockCategory);

      expect(feed.title).toBe('Technology - Mitra Banten News');
      expect(feed.link).toBe('https://example.com/category/technology');
      expect(feed.description).toBe('Berita terkini dalam kategori Technology');
      expect(feed.language).toBe('id');
      expect(feed.items).toHaveLength(1);
    });

    it('should limit to 50 posts', () => {
      const posts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: i,
        title: { rendered: `Post ${i}` },
      }));
      const feed = createCategoryRSSFeed(posts, mockCategory);

      expect(feed.items).toHaveLength(50);
    });

    it('should handle empty posts array', () => {
      const feed = createCategoryRSSFeed([], mockCategory);

      expect(feed.items).toHaveLength(0);
      expect(feed.pubDate).toContain('2026');
    });
  });
});
