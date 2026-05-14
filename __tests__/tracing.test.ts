import { traceAsync, traceSync, addTraceAttribute, tracer } from '@/lib/utils/tracing'

describe('Tracing Utils', () => {
  describe('traceAsync', () => {
    it('should execute async function and return result', async () => {
      const result = await traceAsync(
        'test-async-span',
        { 'test.attribute': 'value' },
        async () => {
          return 'test-result'
        }
      )

      expect(result).toBe('test-result')
    })

    it('should propagate errors from async function', async () => {
      await expect(
        traceAsync(
          'test-error-span',
          {},
          async () => {
            throw new Error('Test error')
          }
        )
      ).rejects.toThrow('Test error')
    })
  })

  describe('traceSync', () => {
    it('should execute sync function and return result', () => {
      const result = traceSync(
        'test-sync-span',
        { 'test.attribute': 'value' },
        () => {
          return 'sync-result'
        }
      )

      expect(result).toBe('sync-result')
    })

    it('should propagate errors from sync function', () => {
      expect(() => {
        traceSync(
          'test-error-sync-span',
          {},
          () => {
            throw new Error('Sync error')
          }
        )
      }).toThrow('Sync error')
    })
  })

  describe('addTraceAttribute', () => {
    it('should not throw when no active span', () => {
      expect(() => {
        addTraceAttribute('test.key', 'value')
      }).not.toThrow()
    })
  })

  describe('tracer', () => {
    it('should be defined', () => {
      expect(tracer).toBeDefined()
    })
  })
})