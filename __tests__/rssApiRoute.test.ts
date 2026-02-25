import { createRSSItem, createRSSFeed, createMainRSSFeed, createCategoryRSSFeed } from '@/lib/utils/rss';
import type { WordPressPost, WordPressCategory } from '@/types/wordpress';

describe('RSS API Route', () => {
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

  describe('RSS Feed Generation', () => {
    it('should generate main RSS feed XML correctly', () => {
      const posts = [mockPost];
      const feed = createMainRSSFeed(posts);
      const xml = createRSSFeed(feed);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<rss version="2.0"');
      expect(xml).toContain('Mitra Banten News');
      expect(xml).toContain('<item>');
    });

    it('should generate category RSS feed XML correctly', () => {
      const posts = [mockPost];
      const feed = createCategoryRSSFeed(posts, mockCategory);
      const xml = createRSSFeed(feed);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('Technology - Mitra Banten News');
      expect(xml).toContain('<item>');
    });

    it('should return valid RSS for single post', () => {
      const item = createRSSItem(mockPost);
      const feed = {
        title: 'Test',
        link: 'https://example.com',
        description: 'Test',
        language: 'en',
        pubDate: item.pubDate,
        items: [item],
      };
      const xml = createRSSFeed(feed);

      expect(xml).toContain('<title>Test Post</title>');
      expect(xml).toContain('<link>https://example.com/test-post</link>');
    });

    it('should handle empty posts for main feed', () => {
      const feed = createMainRSSFeed([]);
      const xml = createRSSFeed(feed);

      expect(xml).toContain('Mitra Banten News');
      expect(xml).not.toContain('<item>');
    });

    it('should handle empty posts for category feed', () => {
      const feed = createCategoryRSSFeed([], mockCategory);
      const xml = createRSSFeed(feed);

      expect(xml).toContain('Technology');
      expect(xml).not.toContain('<item>');
    });
  });
});
