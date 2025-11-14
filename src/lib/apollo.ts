import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
<<<<<<< HEAD
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://mitrabantennews.com/graphql',
=======
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://www.mitrabantennews.com/graphql',
>>>>>>> 64406f1d72c806faff9755f9f93db2a79475480c
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default client;