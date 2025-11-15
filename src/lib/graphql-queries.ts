import { gql } from '@apollo/client';

// GraphQL Queries for WordPress
export const GET_POSTS = gql`
  query GetPosts($first: Int, $after: String, $category: Int, $tag: Int, $search: String) {
    posts(
      first: $first
      after: $after
      where: {
        category: $category
        tag: $tag
        search: $search
        orderby: { field: DATE, order: DESC }
      }
    ) {
      edges {
        node {
          id
          databaseId
          title
          slug
          date
          modified
          content
          excerpt
          status
          link
          author {
            node {
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
          featuredImage {
            node {
              id
              databaseId
              sourceUrl
              title
              altText
              mediaType
              mimeType
            }
          }
          categories {
            edges {
              node {
                id
                databaseId
                name
                slug
                description
                parentId
                count
              }
            }
          }
          tags {
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
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_POST = gql`
  query GetPost($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      date
      modified
      content
      excerpt
      status
      link
      author {
        node {
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
      featuredImage {
        node {
          id
          databaseId
          sourceUrl
          title
          altText
          mediaType
          mimeType
        }
      }
      categories {
        edges {
          node {
            id
            databaseId
            name
            slug
            description
            parentId
            count
          }
        }
      }
      tags {
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
  }
`;

export const GET_POST_BY_ID = gql`
  query GetPostById($id: ID!) {
    post(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      title
      slug
      date
      modified
      content
      excerpt
      status
      link
      author {
        node {
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
      featuredImage {
        node {
          id
          databaseId
          sourceUrl
          title
          altText
          mediaType
          mimeType
        }
      }
      categories {
        edges {
          node {
            id
            databaseId
            name
            slug
            description
            parentId
            count
          }
        }
      }
      tags {
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
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories(first: 100) {
      edges {
        node {
          id
          databaseId
          name
          slug
          description
          parentId
          count
        }
      }
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      parentId
      count
    }
  }
`;

export const GET_TAGS = gql`
  query GetTags {
    tags(first: 100) {
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

export const GET_TAG = gql`
  query GetTag($slug: ID!) {
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

export const SEARCH_POSTS = gql`
  query SearchPosts($search: String!) {
    posts(where: { search: $search }, first: 50) {
      edges {
        node {
          id
          databaseId
          title
          slug
          date
          excerpt
          link
          author {
            node {
              name
            }
          }
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;