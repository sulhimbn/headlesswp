import { gql } from '@apollo/client';

// GraphQL Fragments for reusable fields
export const POST_FIELDS_FRAGMENT = gql`
  fragment PostFields on Post {
    id
    title
    content
    excerpt
    slug
    date
    modified
    status
    link
    author {
      node {
        id
        name
        slug
        description
        avatar {
          url
        }
      }
    }
    featuredImage {
      node {
        id
        sourceUrl
        title
        altText
        mediaType
        mimeType
      }
    }
    categories {
      nodes {
        id
        name
        slug
        description
        count
      }
    }
    tags {
      nodes {
        id
        name
        slug
        description
        count
      }
    }
  }
`;

export const CATEGORY_FIELDS_FRAGMENT = gql`
  fragment CategoryFields on Category {
    id
    name
    slug
    description
    count
    parent {
      node {
        id
        name
        slug
      }
    }
  }
`;

export const TAG_FIELDS_FRAGMENT = gql`
  fragment TagFields on Tag {
    id
    name
    slug
    description
    count
  }
`;

export const AUTHOR_FIELDS_FRAGMENT = gql`
  fragment AuthorFields on User {
    id
    name
    slug
    description
    avatar {
      url
    }
  }
`;

// Posts Queries
export const GET_POSTS = gql`
  ${POST_FIELDS_FRAGMENT}
  query GetPosts($first: Int = 10, $after: String, $category: String, $tag: String, $search: String) {
    posts(first: $first, after: $after, where: { categoryName: $category, tagName: $tag, search: $search }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...PostFields
        }
      }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  ${POST_FIELDS_FRAGMENT}
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...PostFields
    }
  }
`;

export const GET_POST_BY_ID = gql`
  ${POST_FIELDS_FRAGMENT}
  query GetPostById($id: ID!) {
    post(id: $id, idType: DATABASE_ID) {
      ...PostFields
    }
  }
`;

// Categories Queries
export const GET_CATEGORIES = gql`
  ${CATEGORY_FIELDS_FRAGMENT}
  query GetCategories($first: Int = 100) {
    categories(first: $first) {
      edges {
        node {
          ...CategoryFields
        }
      }
    }
  }
`;

export const GET_CATEGORY_BY_SLUG = gql`
  ${CATEGORY_FIELDS_FRAGMENT}
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      ...CategoryFields
    }
  }
`;

// Tags Queries
export const GET_TAGS = gql`
  ${TAG_FIELDS_FRAGMENT}
  query GetTags($first: Int = 100) {
    tags(first: $first) {
      edges {
        node {
          ...TagFields
        }
      }
    }
  }
`;

export const GET_TAG_BY_SLUG = gql`
  ${TAG_FIELDS_FRAGMENT}
  query GetTagBySlug($slug: ID!) {
    tag(id: $slug, idType: SLUG) {
      ...TagFields
    }
  }
`;

// Authors Query
export const GET_AUTHOR_BY_ID = gql`
  ${AUTHOR_FIELDS_FRAGMENT}
  query GetAuthorById($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      ...AuthorFields
    }
  }
`;

// Media Query
export const GET_MEDIA_BY_ID = gql`
  query GetMediaById($id: ID!) {
    mediaItem(id: $id, idType: DATABASE_ID) {
      id
      sourceUrl
      title
      altText
      mediaType
      mimeType
    }
  }
`;

// Search Query
export const SEARCH_POSTS = gql`
  ${POST_FIELDS_FRAGMENT}
  query SearchPosts($search: String!, $first: Int = 10) {
    posts(first: $first, where: { search: $search }) {
      edges {
        node {
          ...PostFields
        }
      }
    }
  }
`;

// Header/Footer Data Query (for theme integration)
export const GET_MENU_DATA = gql`
  query GetMenuData($location: MenuLocationEnum!) {
    menuItems(where: { location: $location }) {
      nodes {
        id
        label
        url
        target
        parentId
        order
        childItems {
          nodes {
            id
            label
            url
            target
          }
        }
      }
    }
  }
`;

export const GET_GENERAL_SETTINGS = gql`
  query GetGeneralSettings {
    generalSettings {
      title
      description
      url
      language
      dateFormat
      timeFormat
      timezone
    }
  }
`;