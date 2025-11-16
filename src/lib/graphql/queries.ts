import { gql } from '@apollo/client';

// Posts queries
export const GET_POSTS = gql`
  query GetPosts($first: Int, $after: String, $where: RootQueryToPostConnectionWhereArgs) {
    posts(first: $first, after: $after, where: $where) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          databaseId
          title
          slug
          content
          excerpt
          date
          modified
          status
          featuredImage {
            node {
              id
              databaseId
              sourceUrl
              altText
              caption
              mediaDetails {
                width
                height
              }
            }
          }
          author {
            node {
              id
              databaseId
              name
              slug
              avatar {
                url
              }
            }
          }
          categories {
            nodes {
              id
              databaseId
              name
              slug
              description
              count
            }
          }
          tags {
            nodes {
              id
              databaseId
              name
              slug
              description
              count
            }
          }
        }
      }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      excerpt
      date
      modified
      status
      featuredImage {
        node {
          id
          databaseId
          sourceUrl
          altText
          caption
          mediaDetails {
            width
            height
          }
        }
      }
      author {
        node {
          id
          databaseId
          name
          slug
          avatar {
            url
          }
          description
        }
      }
      categories {
        nodes {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
      tags {
        nodes {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
    }
  }
`;

export const GET_POST_BY_ID = gql`
  query GetPostById($id: ID!) {
    post(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      title
      slug
      content
      excerpt
      date
      modified
      status
      featuredImage {
        node {
          id
          databaseId
          sourceUrl
          altText
          caption
          mediaDetails {
            width
            height
          }
        }
      }
      author {
        node {
          id
          databaseId
          name
          slug
          avatar {
            url
          }
          description
        }
      }
      categories {
        nodes {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
      tags {
        nodes {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
    }
  }
`;

// Categories queries
export const GET_CATEGORIES = gql`
  query GetCategories($first: Int, $where: RootQueryToCategoryConnectionWhereArgs) {
    categories(first: $first, where: $where) {
      edges {
        node {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
    }
  }
`;

export const GET_CATEGORY_BY_SLUG = gql`
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      count
    }
  }
`;

// Tags queries
export const GET_TAGS = gql`
  query GetTags($first: Int, $where: RootQueryToTagConnectionWhereArgs) {
    tags(first: $first, where: $where) {
      edges {
        node {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
    }
  }
`;

export const GET_TAG_BY_SLUG = gql`
  query GetTagBySlug($slug: ID!) {
    tag(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      count
    }
  }
`;

// Media queries
export const GET_MEDIA_ITEM = gql`
  query GetMediaItem($id: ID!) {
    mediaItem(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      sourceUrl
      altText
      caption
      description
      mediaType
      mimeType
      mediaDetails {
        width
        height
        file
        sizes {
          name
          file
          width
          height
          sourceUrl
        }
      }
    }
  }
`;

// Author queries
export const GET_AUTHOR = gql`
  query GetAuthor($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      name
      slug
      description
      avatar {
        url
      }
    }
  }
`;

// Search query
export const SEARCH_POSTS = gql`
  query SearchPosts($search: String!) {
    posts(where: { search: $search }) {
      edges {
        node {
          id
          databaseId
          title
          slug
          excerpt
          date
          featuredImage {
            node {
              id
              databaseId
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;