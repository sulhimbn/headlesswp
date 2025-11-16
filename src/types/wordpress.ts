export interface WordPressPost {
  id: string | number;
  title: string | { rendered: string };
  content: string | { rendered: string };
  excerpt: string | { rendered: string };
  slug: string;
  date: string;
  modified: string;
  status: string;
  link: string;
  author?: number | { node: WordPressAuthor };
  featured_media?: number | { node: WordPressMedia };
  featuredImage?: {
    node: WordPressMedia;
  };
  categories?: number[] | { nodes: WordPressCategory[] };
  tags?: number[] | { nodes: WordPressTag[] };
  type?: string;
}

export interface WordPressCategory {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent?: number | { node: WordPressCategory };
  link?: string;
}

export interface WordPressTag {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  count: number;
  link?: string;
}

export interface WordPressMedia {
  id: string | number;
  source_url?: string;
  sourceUrl?: string;
  title: string | { rendered: string };
  alt_text?: string;
  altText?: string;
  media_type?: string;
  mediaType?: string;
  mime_type?: string;
  mimeType?: string;
}

export interface WordPressAuthor {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  avatar_urls?: { [key: string]: string };
  avatar?: {
    url: string;
  };
  link?: string;
}

// Enhanced types for better developer experience
export interface WordPressPostWithDetails extends WordPressPost {
  author_details?: WordPressAuthor;
  featured_media_details?: WordPressMedia;
  categories_details?: WordPressCategory[];
  tags_details?: WordPressTag[];
}

export interface WordPressApiResponse<T> {
  data: T;
  headers: {
    'x-wp-total': string;
    'x-wp-totalpages': string;
  };
}