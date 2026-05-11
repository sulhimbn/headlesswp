import type { WordPressPost } from '@/types/wordpress';

export interface JSONFeedItem {
  id: string;
  url: string;
  title: string;
  content_html: string;
  content_text: string;
  date_published: string;
  date_modified?: string;
  author?: {
    name: string;
  }[];
  summary?: string;
  tags?: string[];
  attachments?: {
    url: string;
    mime_type: string;
    size_in_bytes?: number;
  }[];
}

export interface JSONFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description?: string;
  icon?: string;
  favicon?: string;
  language?: string;
  items: JSONFeedItem[];
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function createJSONFeedItem(post: WordPressPost): JSONFeedItem {
  const contentHtml = post.content.rendered;
  const contentText = stripHTML(contentHtml);
  const summary = stripHTML(post.excerpt.rendered);

  return {
    id: post.link,
    url: post.link,
    title: stripHTML(post.title.rendered),
    content_html: contentHtml,
    content_text: contentText,
    date_published: post.date,
    date_modified: post.modified || undefined,
    summary: summary || undefined,
  };
}

export function createMainJSONFeed(posts: WordPressPost[]): JSONFeed {
  const items = posts.slice(0, 50).map(createJSONFeedItem);

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Mitra Banten News',
    home_page_url: 'https://mitrabantennews.com',
    feed_url: 'https://mitrabantennews.com/feed.json',
    description: 'Portal berita terkini dan terpercaya dari Banten',
    language: 'id',
    items,
  };
}