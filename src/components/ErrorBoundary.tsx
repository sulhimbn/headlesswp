import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  nonce?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
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
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render default error message
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Terjadi Kesalahan</h2>
            <p className="text-gray-700 mb-6">
              Maaf, terjadi kesalahan saat memuat konten. Silakan coba beberapa saat lagi.
            </p>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary