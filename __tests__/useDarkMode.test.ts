import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode', () => {
  let mockAddEventListener: jest.Mock
  let mockRemoveEventListener: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    mockAddEventListener = jest.fn()
    mockRemoveEventListener = jest.fn()
    
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: jest.fn(),
    }))
  })

  describe('Initial state', () => {
    test('defaults to system mode when no stored value', () => {
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })

    test('reads stored light mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('reads stored dark mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('reads stored system mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'system')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })

    test('defaults to system when localStorage has invalid value', () => {
      localStorage.setItem(DARK_MODE_KEY, 'invalid')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })
  })

  describe('System preference detection', () => {
    test('detects system dark mode preference', () => {
      localStorage.setItem(DARK_MODE_KEY, 'system')
      
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }))
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(true)
    })

    test('detects system light mode preference', () => {
      localStorage.setItem(DARK_MODE_KEY, 'system')
      
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }))
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('setDarkMode', () => {
    test('sets mode to light', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
    })

    test('sets mode to dark', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })

    test('sets mode to system and uses system preference (dark)', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }))
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('system')
    })

    test('sets mode to system and uses system preference (light)', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('system')
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from dark to light', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
    })

    test('toggles from light to dark', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })
  })

  describe('DOM class manipulation', () => {
    test('adds dark class when isDark is true', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    test('removes dark class when isDark is false', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    test('updates class when toggling dark mode', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Media query listener', () => {
    test('adds event listener on mount', () => {
      renderHook(() => useDarkMode())
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    test('removes event listener on unmount', () => {
      const { unmount } = renderHook(() => useDarkMode())
      
      unmount()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    test('updates isDark when system preference changes in system mode', () => {
      let listenerCallback: ((e: { matches: boolean }) => void) | null = null
      
      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          listenerCallback = callback as (e: { matches: boolean }) => void
        }
      })
      
      localStorage.setItem(DARK_MODE_KEY, 'system')
      
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }))
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(false)
      
      act(() => {
        if (listenerCallback) {
          listenerCallback({ matches: true })
        }
      })
      
      expect(result.current.isDark).toBe(true)
    })

    test('does not update isDark when system preference changes in light mode', () => {
      let listenerCallback: ((e: { matches: boolean }) => void) | null = null
      
      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          listenerCallback = callback as (e: { matches: boolean }) => void
        }
      })
      
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        if (listenerCallback) {
          listenerCallback({ matches: true })
        }
      })
      
      expect(result.current.isDark).toBe(false)
    })

    test('does not update isDark when system preference changes in dark mode', () => {
      let listenerCallback: ((e: { matches: boolean }) => void) | null = null
      
      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          listenerCallback = callback as (e: { matches: boolean }) => void
        }
      })
      
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        if (listenerCallback) {
          listenerCallback({ matches: false })
        }
      })
      
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('SSR safety', () => {
    test('getSystemPreference returns false when window is undefined', () => {
      const { getSystemPreference } = require('@/lib/hooks/useDarkMode')
      
      const originalWindow = global.window
      delete (global as unknown as { window?: unknown }).window
      
      const result = getSystemPreference()
      
      expect(result).toBe(false)
      
      global.window = originalWindow
    })

    test('getStoredMode returns system when window is undefined', () => {
      const { getStoredMode } = require('@/lib/hooks/useDarkMode')
      
      const originalWindow = global.window
      delete (global as unknown as { window?: unknown }).window
      
      const result = getStoredMode()
      
      expect(result).toBe('system')
      
      global.window = originalWindow
    })

    test('hook works when window becomes available after initial render', () => {
      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()
    })
  })
})
