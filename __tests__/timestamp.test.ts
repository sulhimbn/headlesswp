import { createTimestamp } from '@/lib/utils/timestamp'

describe('timestamp utility', () => {
  describe('createTimestamp()', () => {
    it('should return a valid ISO 8601 timestamp string', () => {
      const result = createTimestamp()

      expect(typeof result).toBe('string')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should return a timestamp that can be parsed as a valid date', () => {
      const result = createTimestamp()
      const parsedDate = new Date(result)

      expect(isNaN(parsedDate.getTime())).toBe(false)
    })

    it('should return a timestamp close to the current time', () => {
      const before = new Date().toISOString()
      const result = createTimestamp()
      const after = new Date().toISOString()

      expect(result >= before).toBe(true)
      expect(result <= after).toBe(true)
    })
  })
})