import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Environment-aware GraphQL URL configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 
  (isDevelopment ? 'http://localhost:8080' : 'https://mitrabantennews.com');

const GRAPHQL_ENDPOINT = `${WORDPRESS_URL}/graphql`;

// HTTP link for GraphQL requests
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Apollo Client with caching
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Post: {
        keyFields: ['id'],
        fields: {
          categories: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          tags: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
      Category: {
        keyFields: ['id'],
      },
      Tag: {
        keyFields: ['id'],
      },
      MediaItem: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;