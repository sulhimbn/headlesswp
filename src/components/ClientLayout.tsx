'use client'

import React from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

interface ClientLayoutProps {
  children: React.ReactNode
  nonce?: string
}

export default function ClientLayout({ children, nonce }: ClientLayoutProps) {
  return (
    <ErrorBoundary nonce={nonce}>
      {children}
    </ErrorBoundary>
  )
}