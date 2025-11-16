import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorInfo, ErrorType } from '@/lib/error-handler'

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
  handleError: jest.fn(),
  recoverFromError: jest.fn()
}))

const mockHandleError = require('@/lib/error-handler').handleError
const mockRecoverFromError = require('@/lib/error-handler').recoverFromError

describe('useErrorHandler', () => {
  const createMockErrorInfo = (): ErrorInfo => ({
    type: ErrorType.NETWORK,
    severity: 'MEDIUM' as any,
    message: 'Test error',
    context: { component: 'TestComponent' },
    timestamp: new Date(),
    recoverable: true,
    userMessage: 'Test user message',
    originalError: new Error('Test error')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should set error when setError is called', () => {
    const mockErrorInfo = createMockErrorInfo()
    mockHandleError.mockReturnValue(mockErrorInfo)

    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.setError('Test error', { component: 'TestComponent' })
    })

    expect(mockHandleError).toHaveBeenCalledWith('Test error', { component: 'TestComponent' })
    expect(result.current.error).toBe(mockErrorInfo)
    expect(result.current.isError).toBe(true)
  })

  it('should clear error when clearError is called', () => {
    const mockErrorInfo = createMockErrorInfo()
    mockHandleError.mockReturnValue(mockErrorInfo)

    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.setError('Test error')
    })

    expect(result.current.isError).toBe(true)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('should attempt recovery when retry is called', async () => {
    const mockErrorInfo = createMockErrorInfo()
    mockHandleError.mockReturnValue(mockErrorInfo)
    mockRecoverFromError.mockResolvedValue(true)

    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.setError('Test error')
    })

    expect(result.current.isError).toBe(true)

    await act(async () => {
      await result.current.retry()
    })

    expect(mockRecoverFromError).toHaveBeenCalledWith(mockErrorInfo)
    expect(result.current.error).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('should handle recovery failure', async () => {
    const mockErrorInfo = createMockErrorInfo()
    const recoveryError = new Error('Recovery failed')
    
    mockHandleError.mockReturnValue(mockErrorInfo)
    mockRecoverFromError.mockRejectedValue(recoveryError)

    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.setError('Test error')
    })

    await act(async () => {
      await result.current.retry()
    })

    expect(mockRecoverFromError).toHaveBeenCalledWith(mockErrorInfo)
    expect(mockHandleError).toHaveBeenCalledWith(recoveryError, {
      component: 'useErrorHandler',
      action: 'retry'
    })
  })

  it('should not retry for non-recoverable errors', async () => {
    const mockErrorInfo = createMockErrorInfo()
    mockErrorInfo.recoverable = false
    mockHandleError.mockReturnValue(mockErrorInfo)

    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.setError('Test error')
    })

    await act(async () => {
      await result.current.retry()
    })

    expect(mockRecoverFromError).not.toHaveBeenCalled()
  })

  it('should execute function with error handling', async () => {
    const mockErrorInfo = createMockErrorInfo()
    mockHandleError.mockReturnValue(mockErrorInfo)

    const successFn = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useErrorHandler())

    let executeResult: string | null = null

    await act(async () => {
      executeResult = await result.current.executeWithErrorHandling(
        successFn,
        { component: 'TestComponent' }
      )
    })

    expect(successFn).toHaveBeenCalled()
    expect(executeResult).toBe('success')
    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle function execution error', async () => {
    const mockErrorInfo = createMockErrorInfo()
    mockHandleError.mockReturnValue(mockErrorInfo)

    const errorFn = jest.fn().mockRejectedValue(new Error('Function error'))
    const { result } = renderHook(() => useErrorHandler())

    let executeResult: string | null = null

    await act(async () => {
      executeResult = await result.current.executeWithErrorHandling(
        errorFn,
        { component: 'TestComponent' }
      )
    })

    expect(errorFn).toHaveBeenCalled()
    expect(executeResult).toBeNull()
    expect(mockHandleError).toHaveBeenCalledWith(
      expect.any(Error),
      { component: 'TestComponent' }
    )
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(mockErrorInfo)
    expect(result.current.isLoading).toBe(false)
  })

  it('should set loading state during execution', async () => {
    const { result } = renderHook(() => useErrorHandler())
    
    let resolveFn: (value: string) => void
    const promise = new Promise<string>((resolve) => {
      resolveFn = resolve
    })

    const asyncFn = jest.fn().mockReturnValue(promise)

    act(() => {
      result.current.executeWithErrorHandling(asyncFn)
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveFn('success')
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should clear previous error when executing new function', async () => {
    const mockErrorInfo = createMockErrorInfo()
    mockHandleError.mockReturnValue(mockErrorInfo)

    const { result } = renderHook(() => useErrorHandler())

    // Set initial error
    act(() => {
      result.current.setError('Initial error')
    })

    expect(result.current.isError).toBe(true)

    // Execute successful function
    const successFn = jest.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.executeWithErrorHandling(successFn)
    })

    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle Error objects and strings', () => {
    const mockErrorInfo1 = createMockErrorInfo()
    const mockErrorInfo2 = createMockErrorInfo()
    
    mockHandleError
      .mockReturnValueOnce(mockErrorInfo1)
      .mockReturnValueOnce(mockErrorInfo2)

    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.setError(new Error('Error object'))
    })

    expect(result.current.error).toBe(mockErrorInfo1)

    act(() => {
      result.current.setError('String error')
    })

    expect(result.current.error).toBe(mockErrorInfo2)
  })
})