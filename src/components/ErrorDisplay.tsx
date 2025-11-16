'use client'

import React, { useState } from 'react'
import { ErrorInfo, ErrorType, recoverFromError } from '@/lib/error-handler'

interface ErrorDisplayProps {
  errorInfo: ErrorInfo
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

interface ErrorIconProps {
  type: ErrorType
}

const ErrorIcon: React.FC<ErrorIconProps> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case ErrorType.NETWORK:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )
      case ErrorType.TIMEOUT:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case ErrorType.AUTHENTICATION:
      case ErrorType.PERMISSION:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      case ErrorType.NOT_FOUND:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case ErrorType.VALIDATION:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getIconColor = () => {
    switch (type) {
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return 'text-yellow-500'
      case ErrorType.AUTHENTICATION:
      case ErrorType.PERMISSION:
        return 'text-red-500'
      case ErrorType.NOT_FOUND:
        return 'text-blue-500'
      case ErrorType.VALIDATION:
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={`flex-shrink-0 ${getIconColor()}`}>
      {getIcon()}
    </div>
  )
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  errorInfo, 
  onRetry, 
  onDismiss, 
  className = '' 
}) => {
  const [isRecovering, setIsRecovering] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleRetry = async () => {
    if (!errorInfo.recoverable) return

    setIsRecovering(true)
    try {
      const recovered = await recoverFromError(errorInfo)
      if (recovered && onRetry) {
        onRetry()
      }
    } catch (error) {
      console.error('Recovery failed:', error)
    } finally {
      setIsRecovering(false)
    }
  }

  const getSeverityColor = () => {
    switch (errorInfo.severity) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-50'
      case 'HIGH':
        return 'border-orange-500 bg-orange-50'
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getSeverityColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        <ErrorIcon type={errorInfo.type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {errorInfo.type.replace('_', ' ')}
            </h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-700">
            {errorInfo.userMessage}
          </p>

          {/* Action buttons */}
          <div className="mt-3 flex items-center space-x-2">
            {errorInfo.recoverable && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRecovering}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRecovering ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-700" 
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" 
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mencoba memulihkan...
                  </>
                ) : (
                  'Coba Lagi'
                )}
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showDetails ? 'Sembunyikan' : 'Tampilkan'} Detail
            </button>
          </div>

          {/* Error details */}
          {showDetails && (
            <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Waktu:</span>{' '}
                  {new Date(errorInfo.timestamp).toLocaleString('id-ID')}
                </div>
                <div>
                  <span className="font-medium">Komponen:</span>{' '}
                  {errorInfo.context.component || 'Tidak diketahui'}
                </div>
                <div>
                  <span className="font-medium">Aksi:</span>{' '}
                  {errorInfo.context.action || 'Tidak diketahui'}
                </div>
                {errorInfo.originalError && (
                  <div>
                    <span className="font-medium">Error Asli:</span>{' '}
                    <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                      {errorInfo.originalError.stack || errorInfo.originalError.message}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay