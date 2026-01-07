export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  module: string
  [key: string]: unknown
}

export interface LoggerOptions {
  level?: LogLevel
  enableTimestamp?: boolean
  enableColors?: boolean
}

const DEFAULT_OPTIONS: LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableTimestamp: true,
  enableColors: process.env.NODE_ENV !== 'production'
}

class Logger {
  private options: LoggerOptions

  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= (this.options.level ?? LogLevel.INFO)
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const levelTag = this.getLevelTag(level)
    const timestamp = this.options.enableTimestamp ? `[${new Date().toISOString()}] ` : ''
    const contextStr = context ? ` [${context.module}]` : ''

    return `${timestamp}${levelTag}${contextStr} ${message}`
  }

  private getLevelTag(level: LogLevel): string {
    const tags: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: this.options.enableColors ? '\x1b[36m[DEBUG]\x1b[0m' : '[DEBUG]',
      [LogLevel.INFO]: this.options.enableColors ? '\x1b[32m[INFO]\x1b[0m' : '[INFO]',
      [LogLevel.WARN]: this.options.enableColors ? '\x1b[33m[WARN]\x1b[0m' : '[WARN]',
      [LogLevel.ERROR]: this.options.enableColors ? '\x1b[31m[ERROR]\x1b[0m' : '[ERROR]'
    }
    return tags[level]
  }

  private log(level: LogLevel, message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return
    }

    const context = meta?.module ? { module: String(meta.module) } : undefined
    const formattedMessage = this.formatMessage(level, message, context)

    const consoleMethod = this.getConsoleMethod(level)

    if (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      consoleMethod(formattedMessage, errorObj)
      if (meta && Object.keys(meta).length > 0) {
        consoleMethod('Meta:', meta)
      }
    } else if (meta && Object.keys(meta).length > 0) {
      consoleMethod(formattedMessage, meta)
    } else {
      consoleMethod(formattedMessage)
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
        return console.error
      default:
        return console.log
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, meta)
  }

  warn(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, error, meta)
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error, meta)
  }

  setLevel(level: LogLevel): void {
    this.options.level = level
  }
}

export class LoggerInternal extends Logger {}

export const logger = new Logger()
