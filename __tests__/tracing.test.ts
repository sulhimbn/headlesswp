import {
  traceWordPressAPI,
  traceCacheOperation,
  getTraceId,
  getTraceContextHeaders,
  tracingService,
} from '@/lib/telemetry/tracing'

describe('Tracing Module', () => {
  describe('traceWordPressAPI', () => {
    it('should export a function', () => {
      expect(typeof traceWordPressAPI).toBe('function')
    })
  })

  describe('traceCacheOperation', () => {
    it('should export a function', () => {
      expect(typeof traceCacheOperation).toBe('function')
    })
  })

  describe('getTraceId', () => {
    it('should export a function', () => {
      expect(typeof getTraceId).toBe('function')
    })
  })

  describe('getTraceContextHeaders', () => {
    it('should export a function', () => {
      expect(typeof getTraceContextHeaders).toBe('function')
    })
  })
})

describe('TracingService', () => {
  describe('createSpan', () => {
    it('should create spans for operations', async () => {
      const result = await tracingService.createSpan('test.operation', async () => {
        return 'success'
      })

      expect(result).toBe('success')
    })

    it('should handle errors in spans', async () => {
      await expect(
        tracingService.createSpan('test.error', async () => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')
    })
  })
})