'use client'

import React from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from '@/lib/apollo'
import ErrorBoundary from '@/components/ErrorBoundary'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ApolloProvider>
  )
}