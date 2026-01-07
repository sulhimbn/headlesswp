import { logger, LogLevel, LoggerInternal } from '@/lib/utils/logger'

describe('Logger', () => {
  let testLogger: LoggerInternal
  let consoleDebugSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    testLogger = new LoggerInternal({ level: LogLevel.DEBUG, enableTimestamp: false, enableColors: false })
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('debug', () => {
    it('should log debug messages when level is DEBUG', () => {
      testLogger.debug('Debug message')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Debug message')
    })

    it('should not log debug messages when level is INFO', () => {
      testLogger.setLevel(LogLevel.INFO)
      testLogger.debug('Debug message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should log debug messages with meta data', () => {
      testLogger.debug('Debug message', { module: 'TestModule', userId: 123 })
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] [TestModule] Debug message', { module: 'TestModule', userId: 123 })
    })
  })

  describe('info', () => {
    it('should log info messages when level is INFO', () => {
      testLogger.setLevel(LogLevel.INFO)
      testLogger.info('Info message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Info message')
    })

    it('should not log info messages when level is WARN', () => {
      testLogger.setLevel(LogLevel.WARN)
      testLogger.info('Info message')
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should log info messages with meta data', () => {
      testLogger.info('Info message', { module: 'TestModule', userId: 123 })
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] [TestModule] Info message', { module: 'TestModule', userId: 123 })
    })
  })

  describe('warn', () => {
    it('should log warn messages when level is WARN', () => {
      testLogger.setLevel(LogLevel.WARN)
      testLogger.warn('Warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Warn message')
    })

    it('should not log warn messages when level is ERROR', () => {
      testLogger.setLevel(LogLevel.ERROR)
      testLogger.warn('Warn message')
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should log warn messages with Error object', () => {
      const error = new Error('Test error')
      testLogger.warn('Warn message', error)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Warn message', error)
    })

    it('should log warn messages with unknown error', () => {
      testLogger.warn('Warn message', 'Unknown error')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const errorArg = consoleWarnSpy.mock.calls[0][1]
      expect(errorArg).toBeInstanceOf(Error)
      expect(errorArg.message).toBe('Unknown error')
    })

    it('should log warn messages with error and meta data', () => {
      const error = new Error('Test error')
      testLogger.warn('Warn message', error, { module: 'TestModule' })
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(1, '[WARN] [TestModule] Warn message', error)
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(2, 'Meta:', { module: 'TestModule' })
    })

    it('should log warn messages with meta data only', () => {
      testLogger.warn('Warn message', undefined, { module: 'TestModule', userId: 123 })
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] [TestModule] Warn message', { module: 'TestModule', userId: 123 })
    })
  })

  describe('error', () => {
    it('should log error messages when level is ERROR', () => {
      testLogger.setLevel(LogLevel.ERROR)
      testLogger.error('Error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message')
    })

    it('should always log error messages regardless of level', () => {
      testLogger.setLevel(LogLevel.ERROR)
      testLogger.error('Error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message')
    })

    it('should log error messages with Error object', () => {
      const error = new Error('Test error')
      testLogger.error('Error message', error)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message', error)
    })

    it('should log error messages with unknown error', () => {
      testLogger.error('Error message', { message: 'Unknown error object' })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const errorArg = consoleErrorSpy.mock.calls[0][1]
      expect(errorArg).toBeInstanceOf(Error)
    })

    it('should log error messages with error and meta data', () => {
      const error = new Error('Test error')
      testLogger.error('Error message', error, { module: 'TestModule' })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, '[ERROR] [TestModule] Error message', error)
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Meta:', { module: 'TestModule' })
    })

    it('should log error messages with meta data only', () => {
      testLogger.error('Error message', undefined, { module: 'TestModule', userId: 123 })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] [TestModule] Error message', { module: 'TestModule', userId: 123 })
    })
  })

  describe('setLevel', () => {
    it('should change log level', () => {
      testLogger.setLevel(LogLevel.ERROR)
      testLogger.debug('Debug message')
      testLogger.info('Info message')
      testLogger.warn('Warn message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()

      testLogger.error('Error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('formatting', () => {
    it('should include timestamp when enabled', () => {
      const loggerWithTimestamp = new LoggerInternal({ level: LogLevel.DEBUG, enableTimestamp: true, enableColors: false })
      const dateToISOStringSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z')

      loggerWithTimestamp.info('Info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[2024-01-01T00:00:00.000Z] [INFO] Info message')

      dateToISOStringSpy.mockRestore()
      consoleInfoSpy.mockClear()
    })

    it('should include module name in log message', () => {
      testLogger.debug('Debug message', { module: 'TestModule' })
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] [TestModule] Debug message', { module: 'TestModule' })
    })
  })

  describe('production behavior', () => {
    it('should disable debug logs in production by default', () => {
      const prodLogger = new LoggerInternal({ level: LogLevel.INFO })
      prodLogger.debug('Debug message')
      prodLogger.info('Info message')
      prodLogger.warn('Warn message')
      prodLogger.error('Error message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should disable colors in production by default', () => {
      const prodLogger = new LoggerInternal({ level: LogLevel.DEBUG, enableColors: false })
      prodLogger.debug('Debug message')

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
      expect(consoleDebugSpy).not.toHaveBeenCalledWith(expect.stringContaining('\x1b['))
    })
  })

  describe('default logger', () => {
    it('should export a default logger instance', () => {
      expect(logger).toBeTruthy()
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })

    it('should have default configuration', () => {
      logger.debug('Debug message')
      const logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG

      if (logLevel === LogLevel.DEBUG) {
        expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      } else {
        expect(consoleDebugSpy).not.toHaveBeenCalled()
      }
    })
  })
})
