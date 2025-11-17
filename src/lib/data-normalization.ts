import type { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

// Helper functions to normalize data between REST and GraphQL formats
export const normalizePost = (post: any): WordPressPost => {
  return {
    id: post.id,
    title: typeof post.title === 'string' ? post.title : post.title?.rendered || '',
    content: typeof post.content === 'string' ? post.content : post.content?.rendered || '',
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : post.excerpt?.rendered || '',
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    status: post.status,
    link: post.link,
    author: post.author,
    featured_media: post.featured_media,
    featuredImage: post.featuredImage,
    categories: post.categories,
    tags: post.tags,
    type: post.type,
  };
};

export const normalizeCategory = (category: any): WordPressCategory => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    count: category.count,
    parent: category.parent,
    link: category.link,
  };
};

export const normalizeTag = (tag: any): WordPressTag => {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    count: tag.count,
    link: tag.link,
  };
};

export const normalizeMedia = (media: any): WordPressMedia => {
  return {
    id: media.id,
    source_url: media.source_url || media.sourceUrl,
    sourceUrl: media.sourceUrl || media.source_url,
    title: media.title,
    alt_text: media.alt_text || media.altText,
    altText: media.altText || media.alt_text,
    media_type: media.media_type || media.mediaType,
    mediaType: media.mediaType || media.media_type,
    mime_type: media.mime_type || media.mimeType,
    mimeType: media.mimeType || media.mime_type,
  };
};

export const normalizeAuthor = (author: any): WordPressAuthor => {
  return {
    id: author.id,
    name: author.name,
    slug: author.slug,
    description: author.description,
    avatar_urls: author.avatar_urls,
    avatar: author.avatar,
    link: author.link,
  };
};

// Helper function to get title as string
export const getTitle = (post: WordPressPost): string => {
  return typeof post.title === 'string' ? post.title : post.title?.rendered || '';
};

// Helper function to get content as string
export const getContent = (post: WordPressPost): string => {
  return typeof post.content === 'string' ? post.content : post.content?.rendered || '';
};

// Helper function to get excerpt as string
export const getExcerpt = (post: WordPressPost): string => {
  return typeof post.excerpt === 'string' ? post.excerpt : post.excerpt?.rendered || '';
};

// Helper function to get featured image URL
export const getFeaturedImageUrl = (post: WordPressPost): string => {
  if (post.featuredImage?.node?.sourceUrl) {
    return post.featuredImage.node.sourceUrl;
  }
  if (post.featured_media && typeof post.featured_media === 'number') {
    return `/api/media/${post.featured_media}`;
  }
  return '/placeholder-image.jpg';
};

// Helper function to get categories as array
export const getCategories = (post: WordPressPost): WordPressCategory[] => {
  if (post.categories && Array.isArray(post.categories) && post.categories.length > 0 && typeof post.categories[0] === 'object') {
    return (post.categories as unknown as { nodes: WordPressCategory[] }).nodes;
  }
  return [];
};

// Helper function to get tags as array
export const getTags = (post: WordPressPost): WordPressTag[] => {
  if (post.tags && Array.isArray(post.tags) && post.tags.length > 0 && typeof post.tags[0] === 'object') {
    return (post.tags as unknown as { nodes: WordPressTag[] }).nodes;
  }
  return [];
};

// Helper function to get author
export const getAuthor = (post: WordPressPost): WordPressAuthor | null => {
  if (post.author && typeof post.author === 'object' && 'node' in post.author) {
    return post.author.node;
  }
  return null;
};