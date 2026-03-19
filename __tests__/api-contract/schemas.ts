export const WordPressPostSchema = {
  type: 'object',
  required: ['id', 'title', 'content', 'excerpt', 'slug', 'date', 'modified', 'author', 'categories', 'tags', 'status', 'type', 'link'],
  properties: {
    id: { type: 'integer' },
    title: {
      type: 'object',
      required: ['rendered'],
      properties: { rendered: { type: 'string' } }
    },
    content: {
      type: 'object',
      required: ['rendered'],
      properties: { rendered: { type: 'string' } }
    },
    excerpt: {
      type: 'object',
      required: ['rendered'],
      properties: { rendered: { type: 'string' } }
    },
    slug: { type: 'string' },
    date: { type: 'string' },
    modified: { type: 'string' },
    author: { type: 'integer' },
    featured_media: { type: 'integer' },
    categories: { type: 'array', items: { type: 'integer' } },
    tags: { type: 'array', items: { type: 'integer' } },
    status: { type: 'string', enum: ['publish', 'future', 'draft', 'pending', 'private'] },
    type: { type: 'string' },
    link: { type: 'string' }
  }
};

export const WordPressCategorySchema = {
  type: 'object',
  required: ['id', 'name', 'slug', 'description', 'parent', 'count', 'link'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string' },
    parent: { type: 'integer' },
    count: { type: 'integer' },
    link: { type: 'string' }
  }
};

export const WordPressTagSchema = {
  type: 'object',
  required: ['id', 'name', 'slug', 'description', 'count', 'link'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string' },
    count: { type: 'integer' },
    link: { type: 'string' }
  }
};

export const WordPressMediaSchema = {
  type: 'object',
  required: ['id', 'source_url', 'title', 'alt_text', 'media_type', 'mime_type'],
  properties: {
    id: { type: 'integer' },
    source_url: { type: 'string' },
    title: {
      type: 'object',
      required: ['rendered'],
      properties: { rendered: { type: 'string' } }
    },
    alt_text: { type: 'string' },
    media_type: { type: 'string', enum: ['image', 'video', 'audio', 'file'] },
    mime_type: { type: 'string' }
  }
};

export const WordPressAuthorSchema = {
  type: 'object',
  required: ['id', 'name', 'slug', 'description', 'avatar_urls', 'link'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string' },
    avatar_urls: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    link: { type: 'string' }
  }
};

export const WordPressSearchResultSchema = {
  type: 'object',
  required: ['id', 'title', 'url', 'type', 'subtype'],
  properties: {
    id: { type: 'integer' },
    title: {
      type: 'object',
      required: ['rendered'],
      properties: { rendered: { type: 'string' } }
    },
    url: { type: 'string' },
    type: { type: 'string' },
    subtype: { type: 'string' }
  }
};

export const PaginationHeadersSchema = {
  required: ['x-wp-total', 'x-wp-totalpages'],
  properties: {
    'x-wp-total': { type: 'string', pattern: '^[0-9]+$' },
    'x-wp-totalpages': { type: 'string', pattern: '^[0-9]+$' }
  }
};
