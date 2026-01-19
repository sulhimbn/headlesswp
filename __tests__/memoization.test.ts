import { createArePropsEqual, createDeepPropsEqual } from '@/lib/utils/memoization';

describe('memoization utilities', () => {
  describe('createArePropsEqual', () => {
    it('should return true when all specified props are equal', () => {
      const areEqual = createArePropsEqual<{ a: string; b: number; c: boolean }>(['a', 'b', 'c']);
      const prevProps = { a: 'test', b: 1, c: true };
      const nextProps = { a: 'test', b: 1, c: true };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should return false when any specified prop differs', () => {
      const areEqual = createArePropsEqual<{ a: string; b: number }>(['a', 'b']);
      const prevProps = { a: 'test', b: 1 };
      const nextProps = { a: 'different', b: 1 };
      
      expect(areEqual(prevProps, nextProps)).toBe(false);
    });

    it('should ignore props not specified in propKeys', () => {
      const areEqual = createArePropsEqual<{ a: string; b: number; c: string }>(['a', 'b']);
      const prevProps = { a: 'test', b: 1, c: 'value1' };
      const nextProps = { a: 'test', b: 1, c: 'value2' };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should handle undefined props', () => {
      const areEqual = createArePropsEqual<{ a?: string; b?: number }>(['a', 'b']);
      const prevProps = { a: undefined, b: undefined };
      const nextProps = { a: undefined, b: undefined };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should handle null props', () => {
      const areEqual = createArePropsEqual<{ a: string | null }>(['a']);
      const prevProps = { a: null };
      const nextProps = { a: null };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should differentiate between undefined and null', () => {
      const areEqual = createArePropsEqual<{ a: string | null | undefined }>(['a']);
      const prevProps = { a: undefined };
      const nextProps = { a: null };
      
      expect(areEqual(prevProps, nextProps)).toBe(false);
    });

    it('should handle empty propKeys array', () => {
      const areEqual = createArePropsEqual<{ a: string }>([]);
      const prevProps = { a: 'test' };
      const nextProps = { a: 'different' };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should use shallow comparison for object props', () => {
      const areEqual = createArePropsEqual<{ a: { nested: string } }>(['a']);
      const prevProps = { a: { nested: 'test' } };
      const nextProps = { a: { nested: 'test' } };
      
      expect(areEqual(prevProps, nextProps)).toBe(false);
    });

    it('should use shallow comparison for array props', () => {
      const areEqual = createArePropsEqual<{ a: number[] }>(['a']);
      const prevProps = { a: [1, 2, 3] };
      const nextProps = { a: [1, 2, 3] };
      
      expect(areEqual(prevProps, nextProps)).toBe(false);
    });

    it('should use same reference for objects', () => {
      const areEqual = createArePropsEqual<{ a: { nested: string } }>(['a']);
      const sharedObj = { nested: 'test' };
      const prevProps = { a: sharedObj };
      const nextProps = { a: sharedObj };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });
  });

  describe('createDeepPropsEqual', () => {
    it('should return true when nested objects are structurally equal', () => {
      const areEqual = createDeepPropsEqual<{ a: { nested: string } }>(['a']);
      const prevProps = { a: { nested: 'test' } };
      const nextProps = { a: { nested: 'test' } };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should return false when nested objects differ', () => {
      const areEqual = createDeepPropsEqual<{ a: { nested: string } }>(['a']);
      const prevProps = { a: { nested: 'test' } };
      const nextProps = { a: { nested: 'different' } };
      
      expect(areEqual(prevProps, nextProps)).toBe(false);
    });

    it('should return true when arrays with same values are compared', () => {
      const areEqual = createDeepPropsEqual<{ a: number[] }>(['a']);
      const prevProps = { a: [1, 2, 3] };
      const nextProps = { a: [1, 2, 3] };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should return false when arrays with different values are compared', () => {
      const areEqual = createDeepPropsEqual<{ a: number[] }>(['a']);
      const prevProps = { a: [1, 2, 3] };
      const nextProps = { a: [1, 2, 4] };
      
      expect(areEqual(prevProps, nextProps)).toBe(false);
    });

    it('should ignore props not specified in propKeys', () => {
      const areEqual = createDeepPropsEqual<{ a: { nested: string }; b: number }>(['a']);
      const prevProps = { a: { nested: 'test' }, b: 1 };
      const nextProps = { a: { nested: 'test' }, b: 2 };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      const areEqual = createDeepPropsEqual<{ a: { nested: { deep: string } } }>(['a']);
      const prevProps = { a: { nested: { deep: 'test' } } };
      const nextProps = { a: { nested: { deep: 'test' } } };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should handle arrays of objects', () => {
      const areEqual = createDeepPropsEqual<{ a: { id: number }[] }>(['a']);
      const prevProps = { a: [{ id: 1 }, { id: 2 }] };
      const nextProps = { a: [{ id: 1 }, { id: 2 }] };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });

    it('should use shallow comparison for non-object props', () => {
      const areEqual = createDeepPropsEqual<{ a: string; b: number }>(['a', 'b']);
      const prevProps = { a: 'test', b: 1 };
      const nextProps = { a: 'test', b: 1 };
      
      expect(areEqual(prevProps, nextProps)).toBe(true);
    });
  });
});
