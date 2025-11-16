import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorDisplay from '@/components/ErrorDisplay'
import { ErrorInfo, ErrorType, ErrorSeverity } from '@/lib/error-handler'

// Mock the error handler
jest.mock('@/lib/error-handler', () => ({
  ErrorType: {
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT',
    AUTHENTICATION: 'AUTHENTICATION',
    PERMISSION: 'PERMISSION',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION: 'VALIDATION',
    SYSTEM: 'SYSTEM'
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },
  recoverFromError: jest.fn()
}))

const mockRecoverFromError = require('@/lib/error-handler').recoverFromError

describe('ErrorDisplay', () => {
  const createMockErrorInfo = (
    type: ErrorType = ErrorType.NETWORK,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true
  ): ErrorInfo => ({
    type,
    severity,
    message: 'Test error message',
    context: {
      component: 'TestComponent',
      action: 'testAction'
    },
    timestamp: new Date(),
    recoverable,
    userMessage: 'Test user message',
    originalError: new Error('Test error')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render error information correctly', () => {
    const errorInfo = createMockErrorInfo()
    const onRetry = jest.fn()
    const onDismiss = jest.fn()

    render(
      <ErrorDisplay
        errorInfo={errorInfo}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByText('NETWORK')).toBeInTheDocument()
    expect(screen.getByText('Test user message')).toBeInTheDocument()
    expect(screen.getByText('Coba Lagi')).toBeInTheDocument()
    expect(screen.getByText('Tampilkan Detail')).toBeInTheDocument()
  })

  it('should apply correct severity styling', () => {
    const criticalError = createMockErrorInfo(ErrorType.SYSTEM, ErrorSeverity.CRITICAL)
    const { container } = render(<ErrorDisplay errorInfo={criticalError} />)

    expect(container.firstChild).toHaveClass('border-red-500', 'bg-red-50')
  })

  it('should show retry button only for recoverable errors', () => {
    const recoverableError = createMockErrorInfo(ErrorType.NETWORK, ErrorSeverity.MEDIUM, true)
    const nonRecoverableError = createMockErrorInfo(ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, false)
    const onRetry = jest.fn()

    const { rerender } = render(<ErrorDisplay errorInfo={recoverableError} onRetry={onRetry} />)
    expect(screen.getByText('Coba Lagi')).toBeInTheDocument()

    rerender(<ErrorDisplay errorInfo={nonRecoverableError} onRetry={onRetry} />)
    expect(screen.queryByText('Coba Lagi')).not.toBeInTheDocument()
  })

  it('should call onRetry when retry button is clicked', async () => {
    mockRecoverFromError.mockResolvedValue(true)
    const onRetry = jest.fn()
    const errorInfo = createMockErrorInfo(ErrorType.NETWORK, ErrorSeverity.MEDIUM, true)

    render(
      <ErrorDisplay
        errorInfo={errorInfo}
        onRetry={onRetry}
      />
    )

    const retryButton = screen.getByText('Coba Lagi')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(mockRecoverFromError).toHaveBeenCalledWith(errorInfo)
    })

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled()
    })
  })

  it('should show loading state during recovery', async () => {
    mockRecoverFromError.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const errorInfo = createMockErrorInfo(ErrorType.NETWORK, ErrorSeverity.MEDIUM, true)
    const onRetry = jest.fn()

    render(<ErrorDisplay errorInfo={errorInfo} onRetry={onRetry} />)

    const retryButton = screen.getByText('Coba Lagi')
    fireEvent.click(retryButton)

    expect(screen.getByText('Mencoba memulihkan...')).toBeInTheDocument()
    // The button should be disabled during recovery
    const retryButtonAfter = screen.getByRole('button', { name: /Mencoba memulihkan/ })
    expect(retryButtonAfter).toBeDisabled()
  })

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn()
    const errorInfo = createMockErrorInfo()

    render(
      <ErrorDisplay
        errorInfo={errorInfo}
        onDismiss={onDismiss}
      />
    )

    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)

    expect(onDismiss).toHaveBeenCalled()
  })

  it('should toggle error details when detail button is clicked', () => {
    const errorInfo = createMockErrorInfo()

    render(<ErrorDisplay errorInfo={errorInfo} />)

    expect(screen.queryByText('Waktu:')).not.toBeInTheDocument()

    const detailButton = screen.getByText('Tampilkan Detail')
    fireEvent.click(detailButton)

    expect(screen.getByText('Waktu:')).toBeInTheDocument()
    expect(screen.getByText('Komponen:')).toBeInTheDocument()
    expect(screen.getByText('Aksi:')).toBeInTheDocument()
    expect(screen.getByText('Sembunyikan Detail')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Sembunyikan Detail'))
    expect(screen.queryByText('Waktu:')).not.toBeInTheDocument()
  })

  it('should display error details correctly', () => {
    const errorInfo = createMockErrorInfo()
    errorInfo.context.component = 'TestComponent'
    errorInfo.context.action = 'testAction'

    render(<ErrorDisplay errorInfo={errorInfo} />)

    const detailButton = screen.getByText('Tampilkan Detail')
    fireEvent.click(detailButton)

    expect(screen.getByText('TestComponent')).toBeInTheDocument()
    expect(screen.getByText('testAction')).toBeInTheDocument()
  })

  it('should display original error stack if available', () => {
    const originalError = new Error('Test error')
    originalError.stack = 'Error: Test error\n    at test.js:1:1'
    
    const errorInfo = createMockErrorInfo()
    errorInfo.originalError = originalError

    render(<ErrorDisplay errorInfo={errorInfo} />)

    const detailButton = screen.getByText('Tampilkan Detail')
    fireEvent.click(detailButton)

    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument()
    expect(screen.getByText(/at test.js:1:1/)).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const errorInfo = createMockErrorInfo()
    const customClass = 'custom-test-class'

    const { container } = render(
      <ErrorDisplay
        errorInfo={errorInfo}
        className={customClass}
      />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('should render correct icon for different error types', () => {
    const testCases = [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.AUTHENTICATION,
      ErrorType.PERMISSION,
      ErrorType.NOT_FOUND,
      ErrorType.VALIDATION,
      ErrorType.SYSTEM
    ]

    testCases.forEach(errorType => {
      const { unmount } = render(
        <ErrorDisplay errorInfo={createMockErrorInfo(errorType)} />
      )
      
      // Check that an icon is rendered (svg element)
      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
      
      unmount()
    })
  })

  it('should handle recovery failure gracefully', async () => {
    mockRecoverFromError.mockRejectedValue(new Error('Recovery failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    const errorInfo = createMockErrorInfo(ErrorType.NETWORK, ErrorSeverity.MEDIUM, true)
    const onRetry = jest.fn()

    render(<ErrorDisplay errorInfo={errorInfo} onRetry={onRetry} />)

    const retryButton = screen.getByText('Coba Lagi')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Recovery failed:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})