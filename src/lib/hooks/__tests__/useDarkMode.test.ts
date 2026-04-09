import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '../useDarkMode'

const mockGetItem = jest.fn()
const mockSetItem = jest.fn()

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

describe('useDarkMode', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockGetItem.mockReturnValue(null)
    mockSetItem.mockClear()
  })

  describe('initial state', () => {
    test('defaults to system mode when no stored preference', () => {
      mockGetItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })

    test('returns all required properties', () => {
      const { result } = renderHook(() => useDarkMode())

      expect(result.current).toHaveProperty('isDark')
      expect(result.current).toHaveProperty('toggleDarkMode')
      expect(result.current).toHaveProperty('setDarkMode')
      expect(result.current).toHaveProperty('mode')
      expect(typeof result.current.toggleDarkMode).toBe('function')
      expect(typeof result.current.setDarkMode).toBe('function')
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark mode', async () => {
      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('toggles from dark to light mode', async () => {
      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.toggleDarkMode()
      })
      await act(async () => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('setDarkMode', () => {
    test('sets dark mode explicitly', async () => {
      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('sets light mode explicitly', async () => {
      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('dark')
      })
      await act(async () => {
        result.current.setDarkMode('light')
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('sets system mode', async () => {
      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('system')
      })

      expect(result.current.mode).toBe('system')
    })
  })

  describe('system preference detection', () => {
    test('detects dark mode from system preference', () => {
      mockGetItem.mockReturnValue('system')
      
      const originalMatchMedia = window.matchMedia
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(true)
      
      window.matchMedia = originalMatchMedia
    })

    test('detects light mode from system preference', () => {
      mockGetItem.mockReturnValue('system')
      
      const originalMatchMedia = window.matchMedia
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)
      
      window.matchMedia = originalMatchMedia
    })
  })

  describe('localStorage persistence', () => {
    test('reads stored mode from localStorage', () => {
      mockGetItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('dark')
    })

    test('handles invalid stored value gracefully', () => {
      mockGetItem.mockReturnValue('invalid')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })
  })

  describe('SSR safety', () => {
    test('does not throw during server render', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      consoleError.mockRestore()
    })

    test('handles missing window object', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: typeof window }).window

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.window = originalWindow
    })

    test('handles missing document object', () => {
      const originalDocument = global.document
      delete (global as unknown as { document?: typeof document }).document

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.document = originalDocument
    })
  })
})
