'use client'

import { useState, useCallback } from 'react'
import { ErrorInfo, handleError, recoverFromError } from '@/lib/error-handler'

interface UseErrorHandlerReturn {
  error: ErrorInfo | null
  isError: boolean
  isLoading: boolean
  setError: (error: Error | string, context?: any) => void
  clearError: () => void
  retry: () => Promise<void>
  executeWithErrorHandling: <T>(
    fn: () => Promise<T>,
    context?: any
  ) => Promise<T | null>
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const setError = useCallback((error: Error | string, context?: any) => {
    const errorInfo = handleError(error, context)
    setErrorState(errorInfo)
    return errorInfo
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const retry = useCallback(async () => {
    if (!error || !error.recoverable) return

    setIsLoading(true)
    try {
      const recovered = await recoverFromError(error)
      if (recovered) {
        clearError()
      }
    } catch (retryError) {
      setError(retryError as Error, { component: 'useErrorHandler', action: 'retry' })
    } finally {
      setIsLoading(false)
    }
  }, [error, clearError, setError])

  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    context?: any
  ): Promise<T | null> => {
    setIsLoading(true)
    clearError()

    try {
      const result = await fn()
      return result
    } catch (error) {
      setError(error as Error, context)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [setError, clearError])

  return {
    error,
    isError: error !== null,
    isLoading,
    setError,
    clearError,
    retry,
    executeWithErrorHandling
  }
}

export default useErrorHandler