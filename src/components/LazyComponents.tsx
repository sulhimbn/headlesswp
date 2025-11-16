'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import PostLoading from './PostLoading'

// Lazy load heavy components (placeholders for future implementation)
export const DynamicCommentSection = dynamic(
  () => Promise.resolve(() => <div className="p-4 bg-gray-100 rounded-lg">Comments section coming soon</div>),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg mb-4"></div>,
    ssr: false
  }
)

export const DynamicRelatedPosts = dynamic(
  () => Promise.resolve(() => <div className="p-4 bg-gray-100 rounded-lg">Related posts coming soon</div>),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
      </div>
    ),
    ssr: false
  }
)

export const DynamicNewsletter = dynamic(
  () => Promise.resolve(() => <div className="p-4 bg-gray-100 rounded-lg">Newsletter signup coming soon</div>),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>,
    ssr: false
  }
)

// Wrapper component for lazy loading with error boundary
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <PostLoading />}>
      {children}
    </Suspense>
  )
}