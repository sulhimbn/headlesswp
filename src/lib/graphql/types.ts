// Base types
export interface GraphQLNode {
  id: string;
  databaseId: number;
}

// User/Author types
export interface Avatar {
  url: string;
}

export interface User extends GraphQLNode {
  name: string;
  slug: string;
  description?: string;
  avatar: Avatar;
}

// Media types
export interface MediaSize {
  name: string;
  file: string;
  width: number;
  height: number;
  sourceUrl: string;
}

export interface MediaDetails {
  width?: number;
  height?: number;
  file?: string;
  sizes?: MediaSize[];
}

export interface MediaItem extends GraphQLNode {
  sourceUrl: string;
  altText?: string;
  caption?: string;
  description?: string;
  mediaType: string;
  mimeType: string;
  mediaDetails?: MediaDetails;
}

// Category and Tag types
export interface Category extends GraphQLNode {
  name: string;
  slug: string;
  description?: string;
  count: number;
}

export interface Tag extends GraphQLNode {
  name: string;
  slug: string;
  description?: string;
  count: number;
}

// Post types
export interface FeaturedImage {
  node: MediaItem;
}

export interface Post extends GraphQLNode {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  modified: string;
  status: string;
  featuredImage?: FeaturedImage;
  author: {
    node: User;
  };
  categories: {
    nodes: Category[];
  };
  tags: {
    nodes: Tag[];
  };
}

// Connection types
export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface Edge<T> {
  node: T;
}

export interface Connection<T> {
  pageInfo: PageInfo;
  edges: Edge<T>[];
}

// Query response types
export interface GetPostsResponse {
  posts: Connection<Post>;
}

export interface GetPostBySlugResponse {
  post: Post;
}

export interface GetPostByIdResponse {
  post: Post;
}

export interface GetCategoriesResponse {
  categories: Connection<Category>;
}

export interface GetCategoryBySlugResponse {
  category: Category;
}

export interface GetTagsResponse {
  tags: Connection<Tag>;
}

export interface GetTagBySlugResponse {
  tag: Tag;
}

export interface GetMediaItemResponse {
  mediaItem: MediaItem;
}

export interface GetAuthorResponse {
  user: User;
}

export interface SearchPostsResponse {
  posts: Connection<Post>;
}

// Query variables types
export interface GetPostsVariables {
  first?: number;
  after?: string;
  where?: RootQueryToPostConnectionWhereArgs;
}

export interface GetPostBySlugVariables {
  slug: string;
}

export interface GetPostByIdVariables {
  id: number;
}

export interface GetCategoriesVariables {
  first?: number;
  where?: RootQueryToCategoryConnectionWhereArgs;
}

export interface GetCategoryBySlugVariables {
  slug: string;
}

export interface GetTagsVariables {
  first?: number;
  where?: RootQueryToTagConnectionWhereArgs;
}

export interface GetTagBySlugVariables {
  slug: string;
}

export interface GetMediaItemVariables {
  id: number;
}

export interface GetAuthorVariables {
  id: number;
}

export interface SearchPostsVariables {
  search: string;
}

// WPGraphQL where clause types (simplified)
export interface RootQueryToPostConnectionWhereArgs {
  categoryName?: string;
  tagSlug?: string;
  search?: string;
  authorIn?: number[];
  categoryIn?: number[];
  tagIn?: number[];
  status?: string[];
  orderby?: string[];
  order?: string;
}

export interface RootQueryToCategoryConnectionWhereArgs {
  hideEmpty?: boolean;
  exclude?: number[];
  include?: number[];
  orderby?: string[];
  order?: string;
}

export interface RootQueryToTagConnectionWhereArgs {
  hideEmpty?: boolean;
  exclude?: number[];
  include?: number[];
  orderby?: string[];
  order?: string;
}