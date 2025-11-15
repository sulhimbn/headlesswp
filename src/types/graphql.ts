import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from './wordpress';

// GraphQL Types for WordPress
export interface GraphQLPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  modified: string;
  content: string;
  excerpt: string;
  status: string;
  link: string;
  author: {
    node: GraphQLAuthor;
  };
  featuredImage: {
    node: GraphQLMedia | null;
  };
  categories: {
    edges: Array<{
      node: GraphQLCategory;
    }>;
  };
  tags: {
    edges: Array<{
      node: GraphQLTag;
    }>;
  };
}

export interface GraphQLAuthor {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  avatar: {
    url: string;
  };
}

export interface GraphQLMedia {
  id: string;
  databaseId: number;
  sourceUrl: string;
  title: string;
  altText: string;
  mediaType: string;
  mimeType: string;
}

export interface GraphQLCategory {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  parentId: number;
  count: number;
}

export interface GraphQLTag {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

// GraphQL Response Types
export interface GraphQLPostsResponse {
  posts: {
    edges: Array<{
      node: GraphQLPost;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
}

export interface GraphQLPostResponse {
  post: GraphQLPost | null;
}

export interface GraphQLCategoriesResponse {
  categories: {
    edges: Array<{
      node: GraphQLCategory;
    }>;
  };
}

export interface GraphQLCategoryResponse {
  category: GraphQLCategory | null;
}

export interface GraphQLTagsResponse {
  tags: {
    edges: Array<{
      node: GraphQLTag;
    }>;
  };
}

export interface GraphQLTagResponse {
  tag: GraphQLTag | null;
}

export interface GraphQLSearchResponse {
  posts: {
    edges: Array<{
      node: GraphQLPost;
    }>;
  };
}

// GraphQL Query Variables
export interface GetPostsVariables {
  first?: number;
  after?: string;
  category?: number;
  tag?: number;
  search?: string;
}

export interface GetPostVariables {
  slug: string;
}

export interface GetPostByIdVariables {
  id: number;
}

export interface GetCategoryVariables {
  slug: string;
}

export interface GetTagVariables {
  slug: string;
}

export interface SearchPostsVariables {
  search: string;
}

// Helper function to convert GraphQL Post to WordPressPost interface (for backward compatibility)
export const graphQLPostToWordPressPost = (post: GraphQLPost): WordPressPost => ({
  id: post.databaseId,
  title: {
    rendered: post.title,
  },
  content: {
    rendered: post.content,
  },
  excerpt: {
    rendered: post.excerpt,
  },
  slug: post.slug,
  date: post.date,
  modified: post.modified,
  author: post.author.node.databaseId,
  featured_media: post.featuredImage?.node?.databaseId || 0,
  categories: post.categories.edges.map(edge => edge.node.databaseId),
  tags: post.tags.edges.map(edge => edge.node.databaseId),
  status: post.status,
  type: 'post',
  link: post.link,
});

export const graphQLCategoryToWordPressCategory = (category: GraphQLCategory): WordPressCategory => ({
  id: category.databaseId,
  name: category.name,
  slug: category.slug,
  description: category.description,
  parent: category.parentId,
  count: category.count,
  link: '', // GraphQL doesn't provide link, but it's not essential
});

export const graphQLTagToWordPressTag = (tag: GraphQLTag): WordPressTag => ({
  id: tag.databaseId,
  name: tag.name,
  slug: tag.slug,
  description: tag.description,
  count: tag.count,
  link: '', // GraphQL doesn't provide link, but it's not essential
});

export const graphQLMediaToWordPressMedia = (media: GraphQLMedia): WordPressMedia => ({
  id: media.databaseId,
  source_url: media.sourceUrl,
  title: {
    rendered: media.title,
  },
  alt_text: media.altText,
  media_type: media.mediaType,
  mime_type: media.mimeType,
});

export const graphQLAuthorToWordPressAuthor = (author: GraphQLAuthor): WordPressAuthor => ({
  id: author.databaseId,
  name: author.name,
  slug: author.slug,
  description: author.description,
  avatar_urls: {
    '24': author.avatar.url,
    '48': author.avatar.url,
    '96': author.avatar.url,
  },
  link: '', // GraphQL doesn't provide link, but it's not essential
});