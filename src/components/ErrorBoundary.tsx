import React from 'react'
import { handleError } from '@/lib/error-handler'
import ErrorDisplay from '@/components/ErrorDisplay'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle error with centralized error handler
    const errorInfoHandled = handleError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        reactErrorInfo: errorInfo
      }
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info for display
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Create error info for display
      const errorInfo = handleError(this.state.error, {
        component: this.state.errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown Component',
        action: 'render',
        additionalData: {
          reactErrorInfo: this.state.errorInfo
        }
      })

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-lg w-full">
            <ErrorDisplay
              errorInfo={errorInfo}
              onRetry={this.handleRetry}
              onDismiss={this.handleDismiss}
              className="mb-4"
            />
            
            {/* Fallback UI for critical errors */}
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Halaman Tidak Dapat Dimuat
              </h2>
              <p className="text-gray-600 mb-6">
                Maaf, terjadi kesalahan yang tidak terduga. Kami sedang bekerja untuk memperbaikinya.
              </p>
              <div className="space-y-3">
                <button
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={this.handleRetry}
                >
                  Coba Lagi
                </button>
                <button
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Muat Ulang Halaman
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary