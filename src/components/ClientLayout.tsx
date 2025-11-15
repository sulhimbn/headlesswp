'use client'

import React from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}