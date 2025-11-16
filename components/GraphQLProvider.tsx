'use client';

import { ApolloProvider } from '@apollo/client/react';
import { graphqlClient } from '@/lib/graphql';

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return (
    <ApolloProvider client={graphqlClient}>
      {children}
    </ApolloProvider>
  );
}

export default GraphQLProvider;