import { AxiosError } from 'axios'

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

  if (error instanceof AxiosError) {
    const status = error.response?.status

    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after']
      const waitTime = retryAfter ? ` Please wait ${retryAfter} seconds before retrying.` : ''

      return new ApiErrorImpl(
        ApiErrorType.RATE_LIMIT_ERROR,
        `Rate limit exceeded. Too many requests.${waitTime}`,
        429,
        true,
        error,
        endpoint
      )
    }

    if (status && status >= 500) {
      return new ApiErrorImpl(
        ApiErrorType.SERVER_ERROR,
        `Server error: ${status} ${error.message}`,
        status,
        true,
        error,
        endpoint
      )
    }

    if (status && status >= 400 && status < 500) {
      return new ApiErrorImpl(
        ApiErrorType.CLIENT_ERROR,
        `Client error: ${status} ${error.message}`,
        status,
        false,
        error,
        endpoint
      )
    }
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

    const errorObj = error as { response?: { status?: number; headers?: { [key: string]: string } } };
    const status = errorObj.response?.status;

    if (status === 429) {
      const retryAfter = errorObj.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? ` Please wait ${retryAfter} seconds before retrying.` : '';

      return new ApiErrorImpl(
        ApiErrorType.RATE_LIMIT_ERROR,
        `Rate limit exceeded. Too many requests.${waitTime}`,
        429,
        true,
        error,
        endpoint
      )
    }

    if (status && status >= 500) {
      return new ApiErrorImpl(
        ApiErrorType.SERVER_ERROR,
        `Server error: ${status} ${error.message}`,
        status,
        true,
        error,
        endpoint
      )
    }

    if (status && status >= 400 && status < 500) {
      return new ApiErrorImpl(
        ApiErrorType.CLIENT_ERROR,
        `Client error: ${status} ${error.message}`,
        status,
        false,
        error,
        endpoint
      )
    }
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  return new ApiErrorImpl(
    ApiErrorType.UNKNOWN_ERROR,
    errorMessage,
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

export function shouldRetryRateLimitError(error: ApiError): boolean {
  return error.type === ApiErrorType.RATE_LIMIT_ERROR
}
