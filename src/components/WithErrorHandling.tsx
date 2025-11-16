'use client'

import React from 'react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import ErrorDisplay from '@/components/ErrorDisplay'
import { ErrorInfo } from '@/lib/error-handler'

interface WithErrorHandlingProps {
  fallback?: React.ComponentType<{ error: ErrorInfo; onRetry: () => void }>
  onError?: (error: ErrorInfo) => void
  context?: string
}

interface ErrorWrapperProps {
  children: React.ReactNode
  errorProps: WithErrorHandlingProps
}

const ErrorWrapper: React.FC<ErrorWrapperProps> = ({ children, errorProps }) => {
  const { error, isError, clearError, retry } = useErrorHandler()

  const handleRetry = () => {
    clearError()
    retry()
  }

  if (isError && error) {
    const FallbackComponent = errorProps.fallback
    
    if (FallbackComponent) {
      return <FallbackComponent error={error} onRetry={handleRetry} />
    }

    return (
      <ErrorDisplay
        errorInfo={error}
        onRetry={error.recoverable ? handleRetry : undefined}
        onDismiss={clearError}
      />
    )
  }

  return <>{children}</>
}

export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorHandlingProps = {}
) {
  const WrappedComponent = (props: P) => {
    const errorProps = {
      ...options,
      context: options.context || Component.name
    }

    return (
      <ErrorWrapper errorProps={errorProps}>
        <Component {...props} />
      </ErrorWrapper>
    )
  }

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default withErrorHandling