import { 
  ErrorType, 
  ErrorSeverity, 
  errorHandler, 
  handleError, 
  getUserMessage 
} from '@/lib/error-handler'

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    errorHandler.clearErrors()
  })

  afterEach(() => {
    errorHandler.clearErrors()
  })

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('fetch failed')
      const errorInfo = handleError(networkError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.NETWORK)
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout')
      const errorInfo = handleError(timeoutError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.TIMEOUT)
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should classify authentication errors correctly', () => {
      const authError = new Error('401 unauthorized')
      const errorInfo = handleError(authError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.AUTHENTICATION)
      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH)
    })

    it('should classify permission errors correctly', () => {
      const permissionError = new Error('403 forbidden')
      const errorInfo = handleError(permissionError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.PERMISSION)
      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH)
    })

    it('should classify not found errors correctly', () => {
      const notFoundError = new Error('404 not found')
      const errorInfo = handleError(notFoundError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.NOT_FOUND)
      expect(errorInfo.severity).toBe(ErrorSeverity.LOW)
    })

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Invalid input')
      const errorInfo = handleError(validationError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.VALIDATION)
      expect(errorInfo.severity).toBe(ErrorSeverity.LOW)
    })

    it('should classify system errors correctly', () => {
      const systemError = new Error('System crash')
      const errorInfo = handleError(systemError, { component: 'TestComponent' })

      expect(errorInfo.type).toBe(ErrorType.SYSTEM)
      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH)
    })
  })

  describe('User Message Generation', () => {
    it('should generate appropriate user messages for different error types', () => {
      const testCases = [
        { error: 'fetch failed', expectedMessage: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.' },
        { error: 'Request timeout', expectedMessage: 'Permintaan terlalu lama. Silakan coba lagi.' },
        { error: '401 Unauthorized', expectedMessage: 'Anda tidak memiliki izin untuk mengakses halaman ini.' },
        { error: '403 Forbidden', expectedMessage: 'Akses ditolak. Silakan hubungi administrator.' },
        { error: '404 Not found', expectedMessage: 'Konten yang Anda cari tidak ditemukan.' },
        { error: 'Invalid input', expectedMessage: 'Data yang dimasukkan tidak valid. Silakan periksa kembali.' },
        { error: 'System crash', expectedMessage: 'Terjadi kesalahan pada sistem. Silakan coba lagi nanti.' }
      ]

      testCases.forEach(({ error, expectedMessage }) => {
        const userMessage = getUserMessage(error, { component: 'TestComponent' })
        expect(userMessage).toBe(expectedMessage)
      })
    })
  })

  describe('Error Recovery', () => {
    it('should mark network errors as recoverable', () => {
      const networkError = new Error('fetch failed')
      const errorInfo = handleError(networkError, { component: 'TestComponent' })

      expect(errorInfo.recoverable).toBe(true)
    })

    it('should mark timeout errors as recoverable', () => {
      const timeoutError = new Error('Request timeout')
      const errorInfo = handleError(timeoutError, { component: 'TestComponent' })

      expect(errorInfo.recoverable).toBe(true)
    })

    it('should mark validation errors as recoverable', () => {
      const validationError = new Error('Invalid input')
      const errorInfo = handleError(validationError, { component: 'TestComponent' })

      expect(errorInfo.recoverable).toBe(true)
    })

    it('should mark authentication errors as not recoverable', () => {
      const authError = new Error('401 Unauthorized')
      const errorInfo = handleError(authError, { component: 'TestComponent' })

      expect(errorInfo.recoverable).toBe(false)
    })

    it('should attempt recovery for recoverable errors', async () => {
      const networkError = new Error('fetch failed')
      const errorInfo = handleError(networkError, { component: 'TestComponent' })

      const recovered = await errorHandler.recover(errorInfo)
      expect(recovered).toBe(true)
    })

    it('should not attempt recovery for non-recoverable errors', async () => {
      const authError = new Error('401 Unauthorized')
      const errorInfo = handleError(authError, { component: 'TestComponent' })

      const recovered = await errorHandler.recover(errorInfo)
      expect(recovered).toBe(false)
    })
  })

  describe('Error Logging', () => {
    it('should log errors to console', () => {
      const error = new Error('Test error')
      handleError(error, { component: 'TestComponent', action: 'testAction' })

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining({
          context: expect.objectContaining({
            component: 'TestComponent',
            action: 'testAction'
          })
        })
      )
    })

    it('should store errors in memory', () => {
      const error1 = new Error('Test error 1')
      const error2 = new Error('Test error 2')

      handleError(error1, { component: 'TestComponent1' })
      handleError(error2, { component: 'TestComponent2' })

      const recentErrors = errorHandler.getRecentErrors()
      expect(recentErrors).toHaveLength(2)
      expect(recentErrors[0].message).toBe('Test error 1')
      expect(recentErrors[1].message).toBe('Test error 2')
    })

    it('should limit stored errors to maxErrors', () => {
      // Create more errors than the limit
      for (let i = 0; i < 105; i++) {
        handleError(new Error(`Test error ${i}`), { component: 'TestComponent' })
      }

      const recentErrors = errorHandler.getRecentErrors()
      expect(recentErrors.length).toBeLessThanOrEqual(100) // Should be limited to maxErrors
    })
  })

  describe('Error Statistics', () => {
    it('should provide error statistics', () => {
      handleError(new Error('fetch failed'), { component: 'TestComponent' })
      handleError(new Error('Request timeout'), { component: 'TestComponent' })
      handleError(new Error('fetch failed'), { component: 'TestComponent' })

      const stats = errorHandler.getErrorStats()
      expect(stats[ErrorType.NETWORK]).toBe(2)
      expect(stats[ErrorType.TIMEOUT]).toBe(1)
    })
  })

  describe('Context Handling', () => {
    it('should include context information', () => {
      const error = new Error('Test error')
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
        additionalData: { key: 'value' }
      }

      const errorInfo = handleError(error, context)

      expect(errorInfo.context.component).toBe('TestComponent')
      expect(errorInfo.context.action).toBe('testAction')
      expect(errorInfo.context.userId).toBe('user123')
      expect(errorInfo.context.additionalData).toEqual({ key: 'value' })
    })

    it('should handle string errors', () => {
      const errorInfo = handleError('String error message', { component: 'TestComponent' })

      expect(errorInfo.message).toBe('String error message')
      expect(errorInfo.originalError).toBeInstanceOf(Error)
      expect(errorInfo.originalError?.message).toBe('String error message')
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = errorHandler
      const instance2 = errorHandler

      expect(instance1).toBe(instance2)
    })
  })
})