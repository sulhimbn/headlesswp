export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  type: ApiErrorType
  message: string
  statusCode?: number
  retryable: boolean
  originalError?: unknown
  timestamp: string
  endpoint?: string
}

export class ApiErrorImpl extends Error implements ApiError {
  type: ApiErrorType
  statusCode?: number
  retryable: boolean
  originalError?: unknown
  timestamp: string
  endpoint?: string

  constructor(
    type: ApiErrorType,
    message: string,
    statusCode?: number,
    retryable = false,
    originalError?: unknown,
    endpoint?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = statusCode
    this.retryable = retryable
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
    this.endpoint = endpoint
  }
}

export function createApiError(
  error: unknown,
  endpoint?: string
): ApiError {
  if (error instanceof ApiErrorImpl) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('timeout') || message.includes('etimedout')) {
      return new ApiErrorImpl(
        ApiErrorType.TIMEOUT_ERROR,
        'Request timeout: Server took too long to respond',
        undefined,
        true,
        error,
        endpoint
      )
    }

    if (message.includes('network') || message.includes('enotfound') || message.includes('econnrefused')) {
      return new ApiErrorImpl(
        ApiErrorType.NETWORK_ERROR,
        'Network error: Unable to connect to server',
        undefined,
        true,
        error,
        endpoint
      )
    }
  }

  return new ApiErrorImpl(
    ApiErrorType.UNKNOWN_ERROR,
    'Unknown error occurred',
    undefined,
    false,
    error,
    endpoint
  )
}

export function isRetryableError(error: ApiError): boolean {
  return error.retryable
}

export function shouldTriggerCircuitBreaker(error: ApiError): boolean {
  return (
    error.type === ApiErrorType.TIMEOUT_ERROR ||
    error.type === ApiErrorType.NETWORK_ERROR ||
    error.type === ApiErrorType.SERVER_ERROR
  )
}
