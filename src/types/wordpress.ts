export interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  slug: string;
  date: string;
  modified: string;
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  status: string;
  type: string;
  link: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  link: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  link: string;
}

export interface WordPressMedia {
  id: number;
  source_url: string;
  title: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
}

export interface WordPressAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatar_urls: {
    [key: string]: string;
  };
  link: string;
}

export interface GraphQLPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  author?: {
    node: {
      name: string;
      slug: string;
      avatar?: {
        url: string;
      };
    };
  };
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
      caption?: string;
    };
  };
  categories?: {
    nodes: WordPressCategory[];
  };
  tags?: {
    nodes: WordPressTag[];
  };
}

export interface GraphQLResponse {
  posts?: {
    nodes: GraphQLPost[];
  };
  post?: GraphQLPost | null;
}