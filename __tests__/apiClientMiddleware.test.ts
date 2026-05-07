import { createMiddlewareManager } from '@/lib/api/middleware';
import type { RequestMiddleware, ResponseMiddleware, RequestContext, ResponseContext } from '@/lib/api/middleware';

describe('API Middleware', () => {
  describe('createMiddlewareManager', () => {
    it('should create a middleware manager instance', () => {
      const manager = createMiddlewareManager();
      expect(manager).toBeDefined();
      expect(typeof manager.registerRequestMiddleware).toBe('function');
      expect(typeof manager.registerResponseMiddleware).toBe('function');
    });

    it('should register request middleware', () => {
      const manager = createMiddlewareManager();
      const middleware: RequestMiddleware = (context) => context;
      
      manager.registerRequestMiddleware(middleware, 'test-request');
      const registered = manager.getRegisteredMiddlewares();
      
      expect(registered.request).toContain('test-request');
    });

    it('should register response middleware', () => {
      const manager = createMiddlewareManager();
      const middleware: ResponseMiddleware = (context) => context;
      
      manager.registerResponseMiddleware(middleware, 'test-response');
      const registered = manager.getRegisteredMiddlewares();
      
      expect(registered.response).toContain('test-response');
    });

    it('should execute request middlewares in order', async () => {
      const manager = createMiddlewareManager();
      const order: string[] = [];
      
      const mw1: RequestMiddleware = async (context) => {
        order.push('mw1');
        return { ...context, headers: { ...context.headers, 'mw1': 'true' } };
      };
      const mw2: RequestMiddleware = async (context) => {
        order.push('mw2');
        return { ...context, headers: { ...context.headers, 'mw2': 'true' } };
      };
      
      manager.registerRequestMiddleware(mw1, 'mw1');
      manager.registerRequestMiddleware(mw2, 'mw2');
      
      const context: RequestContext = {
        url: '/test',
        method: 'GET',
        headers: {},
        timestamp: Date.now()
      };
      
      const result = await manager.executeRequestMiddlewares(context);
      
      expect(order).toEqual(['mw1', 'mw2']);
      expect(result.headers['mw1']).toBe('true');
      expect(result.headers['mw2']).toBe('true');
    });

    it('should execute response middlewares in order', async () => {
      const manager = createMiddlewareManager();
      const order: string[] = [];
      
      const mw1: ResponseMiddleware = async (context) => {
        order.push('mw1');
        return { ...context, data: { ...context.data as object, mw1: true } };
      };
      const mw2: ResponseMiddleware = async (context) => {
        order.push('mw2');
        return { ...context, data: { ...context.data as object, mw2: true } };
      };
      
      manager.registerResponseMiddleware(mw1, 'mw1');
      manager.registerResponseMiddleware(mw2, 'mw2');
      
      const context: ResponseContext = {
        status: 200,
        data: {},
        headers: {},
        duration: 100,
        timestamp: Date.now()
      };
      
      const result = await manager.executeResponseMiddlewares(context);
      
      expect(order).toEqual(['mw1', 'mw2']);
      expect(result.data).toHaveProperty('mw1', true);
      expect(result.data).toHaveProperty('mw2', true);
    });

    it('should clear all middlewares', () => {
      const manager = createMiddlewareManager();
      const requestMw: RequestMiddleware = (context) => context;
      const responseMw: ResponseMiddleware = (context) => context;
      
      manager.registerRequestMiddleware(requestMw, 'request');
      manager.registerResponseMiddleware(responseMw, 'response');
      
      manager.clearMiddlewares();
      const registered = manager.getRegisteredMiddlewares();
      
      expect(registered.request).toHaveLength(0);
      expect(registered.response).toHaveLength(0);
    });

    it('should provide default names for unnamed middlewares', () => {
      const manager = createMiddlewareManager();
      const mw: RequestMiddleware = (context) => context;
      
      manager.registerRequestMiddleware(mw);
      const registered = manager.getRegisteredMiddlewares();
      
      expect(registered.request[0]).toBe('request-1');
    });
  });

  describe('RequestMiddlewareContext', () => {
    it('should accept valid request context', async () => {
      const manager = createMiddlewareManager();
      const mw: RequestMiddleware = async (context) => {
        expect(context.url).toBe('/wp/v2/posts');
        expect(context.method).toBe('GET');
        expect(context.headers).toEqual({});
        return context;
      };
      
      manager.registerRequestMiddleware(mw);
      
      const context: RequestContext = {
        url: '/wp/v2/posts',
        method: 'GET',
        headers: {},
        timestamp: Date.now()
      };
      
      await manager.executeRequestMiddlewares(context);
    });
  });

  describe('ResponseMiddlewareContext', () => {
    it('should accept valid response context', async () => {
      const manager = createMiddlewareManager();
      const mw: ResponseMiddleware = async (context) => {
        expect(context.status).toBe(200);
        expect(context.duration).toBe(150);
        expect(context.data).toEqual({ posts: [] });
        return context;
      };
      
      manager.registerResponseMiddleware(mw);
      
      const context: ResponseContext = {
        status: 200,
        data: { posts: [] },
        headers: { 'content-type': 'application/json' },
        duration: 150,
        timestamp: Date.now()
      };
      
      await manager.executeResponseMiddlewares(context);
    });
  });

  describe('middleware transformation', () => {
    it('should allow middleware to modify request headers', async () => {
      const manager = createMiddlewareManager();
      
      const authMw: RequestMiddleware = (context) => ({
        ...context,
        headers: {
          ...context.headers,
          'Authorization': 'Bearer token123'
        }
      });
      
      manager.registerRequestMiddleware(authMw);
      
      const context: RequestContext = {
        url: '/test',
        method: 'POST',
        headers: {},
        timestamp: Date.now()
      };
      
      const result = await manager.executeRequestMiddlewares(context);
      
      expect(result.headers['Authorization']).toBe('Bearer token123');
    });

    it('should allow middleware to modify response data', async () => {
      const manager = createMiddlewareManager();
      
      const transformMw: ResponseMiddleware = (context) => ({
        ...context,
        data: { ...context.data as object, transformed: true }
      });
      
      manager.registerResponseMiddleware(transformMw);
      
      const context: ResponseContext = {
        status: 200,
        data: { original: 'value' },
        headers: {},
        duration: 50,
        timestamp: Date.now()
      };
      
      const result = await manager.executeResponseMiddlewares(context);
      
      expect(result.data).toHaveProperty('original', 'value');
      expect(result.data).toHaveProperty('transformed', true);
    });
  });

  describe('error handling in middlewares', () => {
    it('should propagate errors from request middlewares', async () => {
      const manager = createMiddlewareManager();
      
      const failingMw: RequestMiddleware = async () => {
        throw new Error('Middleware failed');
      };
      
      manager.registerRequestMiddleware(failingMw);
      
      const context: RequestContext = {
        url: '/test',
        method: 'GET',
        headers: {},
        timestamp: Date.now()
      };
      
      await expect(manager.executeRequestMiddlewares(context)).rejects.toThrow('Middleware failed');
    });

    it('should propagate errors from response middlewares', async () => {
      const manager = createMiddlewareManager();
      
      const failingMw: ResponseMiddleware = async () => {
        throw new Error('Response middleware failed');
      };
      
      manager.registerResponseMiddleware(failingMw);
      
      const context: ResponseContext = {
        status: 200,
        data: {},
        headers: {},
        duration: 50,
        timestamp: Date.now()
      };
      
      await expect(manager.executeResponseMiddlewares(context)).rejects.toThrow('Response middleware failed');
    });
  });
});