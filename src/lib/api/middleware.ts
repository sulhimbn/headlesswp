export type RequestMiddleware = (context: RequestContext) => RequestContext | Promise<RequestContext>;
export type ResponseMiddleware = (context: ResponseContext) => ResponseContext | Promise<ResponseContext>;

export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
}

export interface ResponseContext {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  duration: number;
  timestamp: number;
}

interface MiddlewareEntry<T> {
  middleware: T;
  name: string;
}

function createMiddlewareManager() {
  const requestMiddlewares: MiddlewareEntry<RequestMiddleware>[] = [];
  const responseMiddlewares: MiddlewareEntry<ResponseMiddleware>[] = [];

  return {
    registerRequestMiddleware(middleware: RequestMiddleware, name?: string) {
      requestMiddlewares.push({
        middleware,
        name: name || `request-${requestMiddlewares.length + 1}`
      });
    },

    registerResponseMiddleware(middleware: ResponseMiddleware, name?: string) {
      responseMiddlewares.push({
        middleware,
        name: name || `response-${responseMiddlewares.length + 1}`
      });
    },

    async executeRequestMiddlewares(context: RequestContext): Promise<RequestContext> {
      let result = context;
      for (const { middleware } of requestMiddlewares) {
        result = await middleware(result);
      }
      return result;
    },

    async executeResponseMiddlewares(context: ResponseContext): Promise<ResponseContext> {
      let result = context;
      for (const { middleware } of responseMiddlewares) {
        result = await middleware(result);
      }
      return result;
    },

    clearMiddlewares() {
      requestMiddlewares.length = 0;
      responseMiddlewares.length = 0;
    },

    getRegisteredMiddlewares() {
      return {
        request: requestMiddlewares.map(m => m.name),
        response: responseMiddlewares.map(m => m.name)
      };
    }
  };
}

export function createLoggingMiddleware() {
  return {
    request: (async (context: RequestContext) => {
      console.log(`[API Request] ${context.method.toUpperCase()} ${context.url}`);
      return context;
    }) as RequestMiddleware,
    response: (async (context: ResponseContext) => {
      console.log(`[API Response] ${context.status} (${context.duration}ms)`);
      return context;
    }) as ResponseMiddleware
  };
}

export function createCachingHeaderMiddleware() {
  return {
    request: ((context: RequestContext) => {
      return {
        ...context,
        headers: {
          ...context.headers,
          'X-Request-ID': `req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          'X-Timestamp': new Date().toISOString()
        }
      };
    }) as RequestMiddleware,
    response: ((context: ResponseContext) => context) as ResponseMiddleware
  };
}

export function createRequestTimingMiddleware() {
  return {
    request: ((context: RequestContext) => {
      return {
        ...context,
        timestamp: Date.now(),
        headers: {
          ...context.headers,
          'X-Request-Start-Time': Date.now().toString()
        }
      };
    }) as RequestMiddleware,
    response: ((context: ResponseContext) => context) as ResponseMiddleware
  };
}

export function createBuiltinMiddlewares() {
  return createLoggingMiddleware();
}

export type MiddlewareManager = ReturnType<typeof createMiddlewareManager>;

export { createMiddlewareManager };