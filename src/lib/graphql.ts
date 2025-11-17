import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Environment-aware GraphQL endpoint configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 
  (isDevelopment ? 'http://localhost:8080' : 'https://mitrabantennews.com');

const GRAPHQL_ENDPOINT = `${WORDPRESS_URL}/graphql`;

// HTTP link for GraphQL requests
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'same-origin',
});

// Auth link for adding headers if needed in the future
const authLink = setContext((_, { headers }) => {
  // Add any authentication headers here if needed
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  };
});

// Apollo Client configuration
export const graphqlClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
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
      Post: {
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

export default graphqlClient;