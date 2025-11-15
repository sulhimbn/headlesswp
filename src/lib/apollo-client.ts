import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const WORDPRESS_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || 'http://localhost:8080/graphql';

// HTTP link for GraphQL endpoint
const httpLink = createHttpLink({
  uri: WORDPRESS_GRAPHQL_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth link for future API key authentication
const authLink = setContext((_, { headers }) => {
  // Add API key authentication if needed in the future
  const apiKey = process.env.WORDPRESS_API_KEY;
  
  return {
    headers: {
      ...headers,
      ...(apiKey && { authorization: `Bearer ${apiKey}` }),
    },
  };
});

// Cache configuration with proper type policies
const cache = new InMemoryCache({
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
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;