import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { reportWebVitals, measurePageLoad, measureApiCall } from '@/lib/performance'

// Mock window.performance
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: jest.fn(),
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
  writable: true,
})

// Mock web-vitals
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}))

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset window.performanceMetrics
    delete (window as any).performanceMetrics
    delete (window as any).apiMetrics
  })

  describe('reportWebVitals', () => {
    it('should call all web vitals functions', () => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals')
      
      act(() => {
        reportWebVitals()
      })
      
      expect(getCLS).toHaveBeenCalled()
      expect(getFID).toHaveBeenCalled()
      expect(getFCP).toHaveBeenCalled()
      expect(getLCP).toHaveBeenCalled()
      expect(getTTFB).toHaveBeenCalled()
    })

    it('should store metrics in window.performanceMetrics', () => {
      const { getCLS } = require('web-vitals')
      const mockCallback = jest.fn()
      getCLS.mockImplementation((callback: any) => {
        callback({ name: 'CLS', value: 0.1, id: 'test-id' })
      })

      act(() => {
        reportWebVitals()
      })

      expect((window as any).performanceMetrics).toHaveLength(1)
      expect((window as any).performanceMetrics[0]).toMatchObject({
        name: 'CLS',
        value: 0.1,
        id: 'test-id',
      })
    })
  })

  describe('measurePageLoad', () => {
    it('should return page load metrics', () => {
      const mockNavigation = {
        domContentLoadedEventEnd: 1000,
        domContentLoadedEventStart: 500,
        loadEventEnd: 2000,
        loadEventStart: 1500,
        responseStart: 200,
        requestStart: 100,
      }

      ;(window.performance.getEntriesByType as jest.Mock).mockReturnValue([mockNavigation])
      ;(window.performance.getEntriesByType as jest.Mock).mockImplementation((type: string) => {
        if (type === 'navigation') return [mockNavigation]
        if (type === 'paint') return [
          { startTime: 300 }, // firstPaint
          { startTime: 400 }, // firstContentfulPaint
        ]
        return []
      })

      const metrics = measurePageLoad()

      expect(metrics).toMatchObject({
        domContentLoaded: 500,
        loadComplete: 500,
        firstPaint: 300,
        firstContentfulPaint: 400,
        timeToFirstByte: 100,
      })
    })

    it('should return undefined on server side', () => {
      const originalWindow = global.window
      delete (global as any).window

      const metrics = measurePageLoad()

      expect(metrics).toBeUndefined()

      global.window = originalWindow
    })
  })

  describe('measureApiCall', () => {
    it('should measure successful API call', async () => {
      const mockApiCall = jest.fn().mockResolvedValue('success')
      
      const result = await measureApiCall(mockApiCall, 'test-endpoint')

      expect(result).toBe('success')
      expect(mockApiCall).toHaveBeenCalled()
      expect((window as any).apiMetrics).toHaveLength(1)
      expect((window as any).apiMetrics[0]).toMatchObject({
        endpoint: 'test-endpoint',
        success: true,
      })
    })

    it('should measure failed API call', async () => {
      const mockError = new Error('API Error')
      const mockApiCall = jest.fn().mockRejectedValue(mockError)
      
      await expect(measureApiCall(mockApiCall, 'test-endpoint')).rejects.toThrow('API Error')

      expect((window as any).apiMetrics).toHaveLength(1)
      expect((window as any).apiMetrics[0]).toMatchObject({
        endpoint: 'test-endpoint',
        success: false,
        error: 'API Error',
      })
    })

    it('should work on server side', async () => {
      const originalWindow = global.window
      delete (global as any).window

      const mockApiCall = jest.fn().mockResolvedValue('success')
      
      const result = await measureApiCall(mockApiCall, 'test-endpoint')

      expect(result).toBe('success')

      global.window = originalWindow
    })
  })
})