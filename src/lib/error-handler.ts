export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  additionalData?: Record<string, any>
  userAgent?: string
  url?: string
}

export interface ErrorInfo {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  originalError?: Error
  context: ErrorContext
  timestamp: Date
  recoverable: boolean
  userMessage: string
}

class ErrorHandler {
  private static instance: ErrorHandler
  private errors: ErrorInfo[] = []
  private maxErrors = 100 // Keep only last 100 errors in memory

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Classify error type based on error characteristics
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    
    if (error.name === 'TypeError' || message.includes('fetch') || message.includes('network')) {
      return ErrorType.NETWORK
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return ErrorType.PERMISSION
    }
    if (message.includes('404') || message.includes('not found')) {
      return ErrorType.NOT_FOUND
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION
    }
    return ErrorType.SYSTEM
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    if (type === ErrorType.SYSTEM || type === ErrorType.AUTHENTICATION || type === ErrorType.PERMISSION) {
      return ErrorSeverity.HIGH
    }
    if (type === ErrorType.NETWORK || type === ErrorType.TIMEOUT) {
      return ErrorSeverity.MEDIUM
    }
    return ErrorSeverity.LOW
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(type: ErrorType, error: Error): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.'
      case ErrorType.TIMEOUT:
        return 'Permintaan terlalu lama. Silakan coba lagi.'
      case ErrorType.AUTHENTICATION:
        return 'Anda tidak memiliki izin untuk mengakses halaman ini.'
      case ErrorType.PERMISSION:
        return 'Akses ditolak. Silakan hubungi administrator.'
      case ErrorType.NOT_FOUND:
        return 'Konten yang Anda cari tidak ditemukan.'
      case ErrorType.VALIDATION:
        return 'Data yang dimasukkan tidak valid. Silakan periksa kembali.'
      case ErrorType.SYSTEM:
        return 'Terjadi kesalahan pada sistem. Silakan coba lagi nanti.'
      default:
        return 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
  }

  /**
   * Determine if error is recoverable
   */
  private isRecoverable(type: ErrorType): boolean {
    return [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.VALIDATION].includes(type)
  }

  /**
   * Log error to console and internal storage
   */
  private logError(errorInfo: ErrorInfo): void {
    // Log to console with appropriate level
    const logMethod = errorInfo.severity === ErrorSeverity.CRITICAL ? 'error' :
                     errorInfo.severity === ErrorSeverity.HIGH ? 'error' :
                     errorInfo.severity === ErrorSeverity.MEDIUM ? 'warn' : 'info'

    console[logMethod](`[${errorInfo.type}] ${errorInfo.message}`, {
      context: errorInfo.context,
      originalError: errorInfo.originalError,
      timestamp: errorInfo.timestamp,
      recoverable: errorInfo.recoverable
    })

    // Store in memory for debugging
    this.errors.push(errorInfo)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift() // Remove oldest error
    }

    // In production, you might want to send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorInfo)
    }
  }

  /**
   * Send error to external monitoring service (placeholder)
   */
  private sendToExternalService(errorInfo: ErrorInfo): void {
    // Integration with services like Sentry, LogRocket, etc.
    // This is a placeholder for external error reporting
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: errorInfo.message,
        fatal: errorInfo.severity === ErrorSeverity.CRITICAL
      })
    }
  }

  /**
   * Handle and log an error
   */
  public handle(error: Error | string, context: ErrorContext = {}): ErrorInfo {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    const type = this.classifyError(errorObj)
    const severity = this.determineSeverity(errorObj, type)
    const userMessage = this.generateUserMessage(type, errorObj)
    const recoverable = this.isRecoverable(type)

    const errorInfo: ErrorInfo = {
      type,
      severity,
      message: errorObj.message,
      originalError: errorObj,
      context: {
        ...context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      },
      timestamp: new Date(),
      recoverable,
      userMessage
    }

    this.logError(errorInfo)
    return errorInfo
  }

  /**
   * Try to recover from an error
   */
  public async recover(errorInfo: ErrorInfo): Promise<boolean> {
    if (!errorInfo.recoverable) {
      return false
    }

    try {
      switch (errorInfo.type) {
        case ErrorType.NETWORK:
        case ErrorType.TIMEOUT:
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 2000))
          return true
        case ErrorType.VALIDATION:
          // Validation errors need user input, can't auto-recover
          return false
        default:
          return false
      }
    } catch (recoveryError) {
      this.handle(recoveryError as Error, { 
        component: 'ErrorHandler', 
        action: 'recover',
        additionalData: { originalError: errorInfo }
      })
      return false
    }
  }

  /**
   * Get user-friendly message for an error
   */
  public getUserMessage(error: Error | string, context: ErrorContext = {}): string {
    const errorInfo = this.handle(error, context)
    return errorInfo.userMessage
  }

  /**
   * Get recent errors for debugging
   */
  public getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errors.slice(-count)
  }

  /**
   * Clear error history
   */
  public clearErrors(): void {
    this.errors = []
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<ErrorType, number> {
    const stats: Record<string, number> = {}
    this.errors.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1
    })
    return stats as Record<ErrorType, number>
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Export convenience functions
export const handleError = (error: Error | string, context?: ErrorContext) => 
  errorHandler.handle(error, context)

export const getUserMessage = (error: Error | string, context?: ErrorContext) => 
  errorHandler.getUserMessage(error, context)

export const recoverFromError = (errorInfo: ErrorInfo) => 
  errorHandler.recover(errorInfo)