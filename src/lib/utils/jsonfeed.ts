import type { WordPressPost, WordPressCategory } from '@/types/wordpress';
import { SITE_URL } from '@/lib/api/config';

/**
 * JSON Feed 1.1 types based on https://www.jsonfeed.org/version/1.1
 */

export interface JSONFeedItem {
  id: string;
  url: string;
  title: string;
  content_html: string;
  date_modified: string;
  date_published?: string;
  author?: {
    name: string;
  };
  tags?: string[];
}

export interface JSONFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description?: string;
  items: JSONFeedItem[];
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function formatISO8601Date(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString();
}

export function createJSONFeedItem(post: WordPressPost): JSONFeedItem {
  return {
    id: post.link,
    url: post.link,
    title: stripHTML(post.title.rendered),
    content_html: post.content.rendered,
    date_modified: formatISO8601Date(post.modified),
    date_published: formatISO8601Date(post.date),
  };
}

export function createMainJSONFeed(posts: WordPressPost[]): JSONFeed {
  const items = posts.slice(0, 50).map(createJSONFeedItem);

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Mitra Banten News',
    home_page_url: SITE_URL,
    feed_url: `${SITE_URL}/api/feed.json`,
    description: 'Portal berita terkini dan terpercaya dari Banten',
    items,
  };
}

export function createCategoryJSONFeed(posts: WordPressPost[], category: WordPressCategory): JSONFeed {
  const items = posts.slice(0, 50).map(createJSONFeedItem);

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${category.name} - Mitra Banten News`,
    home_page_url: category.link,
    feed_url: `${SITE_URL}/api/feed.json?category=${category.slug}`,
    description: `Berita terkini dalam kategori ${category.name}`,
    items,
  };
}
