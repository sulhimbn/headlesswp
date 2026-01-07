import {
  createSuccessResult,
  createErrorResult,
  isApiResultSuccessful,
  unwrapApiResult,
  unwrapApiResultSafe,
  ApiResult,
  ApiListResult,
  ApiMetadata,
  ApiPaginationMetadata
} from '@/lib/api/response';
import { ApiError, ApiErrorType } from '@/lib/api/errors';

describe('API Response Wrapper', () => {
  describe('createSuccessResult', () => {
    it('should create a success result with data and default metadata', () => {
      const data = { id: 1, name: 'Test' };
      const result = createSuccessResult(data);

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(typeof result.metadata.timestamp).toBe('string');
      expect(result.pagination).toBeUndefined();
    });

    it('should create a success result with custom metadata', () => {
      const data = { id: 1, name: 'Test' };
      const customMetadata: Partial<ApiMetadata> = {
        endpoint: '/api/posts',
        cacheHit: true,
        retryCount: 2
      };
      const result = createSuccessResult(data, customMetadata);

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(result.metadata.endpoint).toBe(customMetadata.endpoint);
      expect(result.metadata.cacheHit).toBe(customMetadata.cacheHit);
      expect(result.metadata.retryCount).toBe(customMetadata.retryCount);
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should create a success result with pagination metadata', () => {
      const data = [{ id: 1, name: 'Test' }];
      const pagination: ApiPaginationMetadata = {
        page: 1,
        perPage: 10,
        total: 100,
        totalPages: 10
      };
      const result = createSuccessResult(data, {}, pagination);

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(result.pagination).toEqual(pagination);
    });

    it('should generate valid ISO timestamp in metadata', () => {
      const data = { id: 1 };
      const result = createSuccessResult(data);
      const timestamp = result.metadata.timestamp;

      const date = new Date(timestamp);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should merge custom metadata with default timestamp', () => {
      const data = { id: 1 };
      const customMetadata: Partial<ApiMetadata> = {
        endpoint: '/api/test'
      };
      const result = createSuccessResult(data, customMetadata);

      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.endpoint).toBe(customMetadata.endpoint);
    });
  });

  describe('createErrorResult', () => {
    it('should create an error result with ApiError', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error occurred',
        statusCode: 500,
        retryable: true,
        timestamp: new Date().toISOString(),
        endpoint: '/api/posts'
      };
      const result = createErrorResult<number>(error);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should create an error result with custom metadata', () => {
      const error: ApiError = {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const customMetadata: Partial<ApiMetadata> = {
        endpoint: '/api/users',
        retryCount: 1
      };
      const result = createErrorResult<string>(error, customMetadata);

      expect(result.error).toEqual(error);
      expect(result.metadata.endpoint).toBe(customMetadata.endpoint);
      expect(result.metadata.retryCount).toBe(customMetadata.retryCount);
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should not include pagination in error result', () => {
      const error: ApiError = {
        type: ApiErrorType.CLIENT_ERROR,
        message: 'Bad request',
        statusCode: 400,
        retryable: false,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<any[]>(error);

      expect(result.pagination).toBeUndefined();
    });

    it('should generate valid ISO timestamp in metadata', () => {
      const error: ApiError = {
        type: ApiErrorType.UNKNOWN_ERROR,
        message: 'Unknown error',
        retryable: false,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult(error);
      const timestamp = result.metadata.timestamp;

      const date = new Date(timestamp);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  describe('isApiResultSuccessful', () => {
    it('should return true for successful result', () => {
      const result: ApiResult<{ id: number }> = {
        data: { id: 1 },
        error: null,
        metadata: { timestamp: new Date().toISOString() }
      };

      expect(isApiResultSuccessful(result)).toBe(true);
    });

    it('should return false for error result', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result: ApiResult<{ id: number }> = {
        data: null as unknown as { id: number },
        error,
        metadata: { timestamp: new Date().toISOString() }
      };

      expect(isApiResultSuccessful(result)).toBe(false);
    });

    it('should narrow type correctly for successful result', () => {
      const result: ApiResult<{ id: number }> = {
        data: { id: 1 },
        error: null,
        metadata: { timestamp: new Date().toISOString() }
      };

      if (isApiResultSuccessful(result)) {
        expect(result.error).toBeNull();
        expect(result.data.id).toBe(1);
      }
    });

    it('should narrow type correctly for error result', () => {
      const error: ApiError = {
        type: ApiErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limit exceeded',
        statusCode: 429,
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result: ApiResult<{ id: number }> = {
        data: null as unknown as { id: number },
        error,
        metadata: { timestamp: new Date().toISOString() }
      };

      if (!isApiResultSuccessful(result)) {
        expect(result.error).not.toBeNull();
        expect(result.error?.type).toBe(ApiErrorType.RATE_LIMIT_ERROR);
      }
    });
  });

  describe('unwrapApiResult', () => {
    it('should return data when result is successful', () => {
      const data = { id: 1, name: 'Test', email: 'test@example.com' };
      const result = createSuccessResult(data);

      const unwrapped = unwrapApiResult(result);

      expect(unwrapped).toEqual(data);
      expect(unwrapped.id).toBe(1);
      expect(unwrapped.name).toBe('Test');
      expect(unwrapped.email).toBe('test@example.com');
    });

    it('should throw error when result has error', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Internal server error',
        statusCode: 500,
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<{ id: number }>(error);

      expect(() => unwrapApiResult(result)).toThrow();
    });

    it('should throw error with message from ApiError', () => {
      const error: ApiError = {
        type: ApiErrorType.CLIENT_ERROR,
        message: 'Invalid request parameters',
        statusCode: 400,
        retryable: false,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<any>(error);

      expect(() => unwrapApiResult(result)).toThrow('Invalid request parameters');
    });

    it('should work with array data types', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      const result = createSuccessResult(data);

      const unwrapped = unwrapApiResult(result);

      expect(unwrapped).toEqual(data);
      expect(unwrapped).toHaveLength(3);
    });

    it('should work with primitive data types', () => {
      const data = 'test-string-value';
      const result = createSuccessResult(data);

      const unwrapped = unwrapApiResult(result);

      expect(unwrapped).toBe('test-string-value');
    });

    it('should work with number data types', () => {
      const data = 42;
      const result = createSuccessResult(data);

      const unwrapped = unwrapApiResult(result);

      expect(unwrapped).toBe(42);
    });

    it('should work with boolean data types', () => {
      const data = true;
      const result = createSuccessResult(data);

      const unwrapped = unwrapApiResult(result);

      expect(unwrapped).toBe(true);
    });
  });

  describe('unwrapApiResultSafe', () => {
    it('should return data when result is successful', () => {
      const data = { id: 1, name: 'Test' };
      const result = createSuccessResult(data);
      const defaultValue = { id: 0, name: 'Default' };

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(data);
      expect(unwrapped.id).toBe(1);
    });

    it('should return default value when result has error', () => {
      const error: ApiError = {
        type: ApiErrorType.TIMEOUT_ERROR,
        message: 'Request timeout',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<{ id: number; name: string }>(error);
      const defaultValue = { id: 0, name: 'Fallback' };

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(defaultValue);
      expect(unwrapped.id).toBe(0);
      expect(unwrapped.name).toBe('Fallback');
    });

    it('should not throw error when result has error', () => {
      const error: ApiError = {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<any>(error);
      const defaultValue = 'default-value';

      expect(() => unwrapApiResultSafe(result, defaultValue)).not.toThrow();
    });

    it('should work with array data and array default value', () => {
      const data = [1, 2, 3];
      const result = createSuccessResult(data);
      const defaultValue: number[] = [];

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(data);
      expect(unwrapped).toHaveLength(3);
    });

    it('should work with array data and return default on error', () => {
      const error: ApiError = {
        type: ApiErrorType.UNKNOWN_ERROR,
        message: 'Unknown error',
        retryable: false,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<number[]>(error);
      const defaultValue: number[] = [0, 0, 0];

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(defaultValue);
    });

    it('should work with null default value', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<{ id: number }>(error);

      const unwrapped = unwrapApiResultSafe(result, null);

      expect(unwrapped).toBeNull();
    });

    it('should work with undefined default value', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<{ id: number }>(error);

      const unwrapped = unwrapApiResultSafe(result, undefined);

      expect(unwrapped).toBeUndefined();
    });

    it('should work with empty string default value', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<string>(error);
      const defaultValue = '';

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toBe('');
    });

    it('should work with numeric default value', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<number>(error);
      const defaultValue = 0;

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toBe(0);
    });
  });

  describe('ApiListResult', () => {
    it('should create a list result with pagination', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const pagination: ApiPaginationMetadata = {
        page: 1,
        perPage: 10,
        total: 3,
        totalPages: 1
      };
      const result = createSuccessResult(data, {}, pagination) as ApiListResult<{ id: number }>;

      expect(result.data).toEqual(data);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.perPage).toBe(10);
      expect(result.pagination?.total).toBe(3);
      expect(result.pagination?.totalPages).toBe(1);
    });

    it('should unwrap list result safely', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = createSuccessResult(data, {}, { page: 1, perPage: 10, total: 2, totalPages: 1 });
      const defaultValue: { id: number }[] = [];

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(data);
      expect(unwrapped).toHaveLength(2);
    });

    it('should handle empty list result', () => {
      const data: any[] = [];
      const pagination: ApiPaginationMetadata = {
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
      };
      const result = createSuccessResult(data, {}, pagination) as ApiListResult<any>;

      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
      expect(result.pagination?.total).toBe(0);
    });
  });

  describe('Integration with ApiError', () => {
    it('should handle rate limit error with unwrapApiResultSafe', () => {
      const error: ApiError = {
        type: ApiErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limit exceeded. Please wait 60 seconds.',
        statusCode: 429,
        retryable: true,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<number[]>(error);
      const defaultValue: number[] = [];

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(defaultValue);
    });

    it('should handle circuit breaker open error', () => {
      const error: ApiError = {
        type: ApiErrorType.CIRCUIT_BREAKER_OPEN,
        message: 'Circuit breaker is open. Service unavailable.',
        retryable: false,
        timestamp: new Date().toISOString()
      };
      const result = createErrorResult<{ id: number }>(error);
      const defaultValue = { id: 0, status: 'unavailable' };

      const unwrapped = unwrapApiResultSafe(result, defaultValue);

      expect(unwrapped).toEqual(defaultValue);
    });

    it('should throw correctly for server errors with unwrapApiResult', () => {
      const error: ApiError = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Internal Server Error',
        statusCode: 500,
        retryable: true,
        timestamp: new Date().toISOString(),
        endpoint: '/api/posts'
      };
      const result = createErrorResult<any>(error);

      expect(() => unwrapApiResult(result)).toThrow('Internal Server Error');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type information through createSuccessResult and unwrapApiResult', () => {
      interface UserData {
        id: number;
        name: string;
        email: string;
      }

      const data: UserData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };
      const result = createSuccessResult<UserData>(data);
      const unwrapped = unwrapApiResult(result);

      expect(unwrapped.id).toBe(1);
      expect(unwrapped.name).toBe('Test User');
      expect(unwrapped.email).toBe('test@example.com');
    });

    it('should work with complex nested types', () => {
      interface PostWithAuthor {
        id: number;
        title: string;
        author: {
          id: number;
          name: string;
        };
      }

      const data: PostWithAuthor = {
        id: 1,
        title: 'Test Post',
        author: {
          id: 1,
          name: 'Author Name'
        }
      };
      const result = createSuccessResult<PostWithAuthor>(data);
      const unwrapped = unwrapApiResult(result);

      expect(unwrapped.id).toBe(1);
      expect(unwrapped.title).toBe('Test Post');
      expect(unwrapped.author.id).toBe(1);
      expect(unwrapped.author.name).toBe('Author Name');
    });

    it('should handle optional fields in type', () => {
      interface OptionalData {
        id: number;
        required: string;
        optional?: string;
      }

      const data: OptionalData = {
        id: 1,
        required: 'value'
      };
      const result = createSuccessResult<OptionalData>(data);
      const unwrapped = unwrapApiResult(result);

      expect(unwrapped.id).toBe(1);
      expect(unwrapped.required).toBe('value');
      expect(unwrapped.optional).toBeUndefined();
    });
  });
});
