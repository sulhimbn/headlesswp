'use client'

import React from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ApolloProvider } from '@apollo/client'
import { client } from '@/lib/apollo'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ApolloProvider client={client}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ApolloProvider>
  )
}