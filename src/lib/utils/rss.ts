import type { WordPressPost, WordPressCategory } from '@/types/wordpress';
import { SITE_URL } from '@/lib/api/config';

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  author?: string;
  categories?: string[];
}

export interface RSSFeed {
  title: string;
  link: string;
  description: string;
  language: string;
  pubDate: string;
  items: RSSItem[];
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function formatRFC822Date(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getUTCDay()];
  const day = date.getUTCDate().toString().padStart(2, '0');
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  
  return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} +0000`;
}

export function createRSSItem(post: WordPressPost): RSSItem {
  return {
    title: stripHTML(post.title.rendered),
    link: post.link,
    description: stripHTML(post.excerpt.rendered),
    pubDate: formatRFC822Date(post.date),
    guid: post.link,
    categories: [],
  };
}

export function createRSSFeed(feed: RSSFeed): string {
  const itemsXML = feed.items.map(item => {
    const categoriesXML = item.categories?.length 
      ? item.categories.map(cat => `      <category>${escapeXML(cat)}</category>`).join('\n') + '\n'
      : '';
    
    return `    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${escapeXML(item.link)}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXML(item.guid)}</guid>
${categoriesXML}    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(feed.title)}</title>
    <link>${escapeXML(feed.link)}</link>
    <description>${escapeXML(feed.description)}</description>
    <language>${feed.language}</language>
    <pubDate>${feed.pubDate}</pubDate>
    <lastBuildDate>${feed.pubDate}</lastBuildDate>
    <atom:link href="${feed.link}/rss" rel="self" type="application/rss+xml" />
${itemsXML}
  </channel>
</rss>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createMainRSSFeed(posts: WordPressPost[]): RSSFeed {
  const items = posts.slice(0, 50).map(createRSSItem);
  
  return {
    title: 'Mitra Banten News',
    link: SITE_URL,
    description: 'Portal berita terkini dan terpercaya dari Banten',
    language: 'id',
    pubDate: items.length > 0 ? items[0].pubDate : formatRFC822Date(new Date().toISOString()),
    items,
  };
}

export function createCategoryRSSFeed(posts: WordPressPost[], category: WordPressCategory): RSSFeed {
  const items = posts.slice(0, 50).map(createRSSItem);
  
  return {
    title: `${category.name} - Mitra Banten News`,
    link: category.link,
    description: `Berita terkini dalam kategori ${category.name}`,
    language: 'id',
    pubDate: items.length > 0 ? items[0].pubDate : formatRFC822Date(new Date().toISOString()),
    items,
  };
}
