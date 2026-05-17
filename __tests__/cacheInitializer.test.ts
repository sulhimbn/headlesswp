import { cacheInitializer } from '@/lib/services/cacheInitializer'

jest.mock('@/lib/services/cacheWarmer', () => ({
  cacheWarmer: {
    warmAll: jest.fn().mockResolvedValue({
      total: 3,
      success: 3,
      failed: 0,
      results: [],
    }),
  },
}))

describe('cacheInitializer', () => {
  describe('initialize()', () => {
    it('should be a function', () => {
      expect(typeof cacheInitializer.initialize).toBe('function')
    })
  })

  describe('isInitialized()', () => {
    it('should be a function', () => {
      expect(typeof cacheInitializer.isInitialized).toBe('function')
    })
  })
})