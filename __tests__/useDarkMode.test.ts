import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode', () => {
  let originalMatchMedia: typeof window.matchMedia
  let originalLocalStorage: Storage
  let mockMatchMedia: jest.Mock

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalLocalStorage = window.localStorage
    mockMatchMedia = jest.fn()
    window.matchMedia = mockMatchMedia
    window.localStorage.clear()
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList)
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
    document.documentElement.classList.remove('dark')
  })

  describe('Initial state', () => {
    test('defaults to system mode when no stored value', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('defaults to light mode when system preference is false', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('defaults to dark mode when system preference is true', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('localStorage persistence', () => {
    test('loads stored dark mode from localStorage', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'dark')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('loads stored light mode from localStorage', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'light')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('loads stored system mode from localStorage', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'system')
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
    })

    test('defaults to system for invalid stored value', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'invalid')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('saves dark mode to localStorage when setDarkMode is called', () => {
      const { result } = renderHook(() => useDarkMode())
      act(() => {
        result.current.setDarkMode('dark')
      })
      expect(window.localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })

    test('saves light mode to localStorage when setDarkMode is called', () => {
      const { result } = renderHook(() => useDarkMode())
      act(() => {
        result.current.setDarkMode('light')
      })
      expect(window.localStorage.getItem(DARK_MODE_KEY)).toBe('light')
    })

    test('saves system mode to localStorage when setDarkMode is called', () => {
      const { result } = renderHook(() => useDarkMode())
      act(() => {
        result.current.setDarkMode('system')
      })
      expect(window.localStorage.getItem(DARK_MODE_KEY)).toBe('system')
    })
  })

  describe('Dark mode toggle', () => {
    test('toggles from light to dark', () => {
      const { result } = renderHook(() => useDarkMode())
      act(() => {
        result.current.toggleDarkMode()
      })
      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')
    })

    test('toggles from dark to light', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'dark')
      const { result } = renderHook(() => useDarkMode())
      act(() => {
        result.current.toggleDarkMode()
      })
      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('light')
    })
  })

  describe('System preference detection', () => {
    test('detects dark system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })

    test('detects light system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('updates when mode is set to system', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'dark')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)

      act(() => {
        result.current.setDarkMode('system')
      })
      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('system')
    })

    test('ignores system preference when mode is explicitly set', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })
      expect(result.current.isDark).toBe(false)

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)

      act(() => {
        result.current.toggleDarkMode()
      })
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Error handling for localStorage unavailable', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      })
    })

    test('handles localStorage being undefined', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })

    test('setDarkMode does not throw when localStorage is undefined', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(() => {
        act(() => {
          result.current.setDarkMode('dark')
        })
      }).not.toThrow()
    })

    test('toggleDarkMode does not throw when localStorage is undefined', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(() => {
        act(() => {
          result.current.toggleDarkMode()
        })
      }).not.toThrow()
    })
  })

  describe('localStorage availability checks', () => {
    test('handles localStorage.getItem throwing error', () => {
      const brokenLocalStorage = {
        getItem: jest.fn(() => { throw new Error('localStorage error') }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0,
      }
      Object.defineProperty(window, 'localStorage', {
        value: brokenLocalStorage,
        writable: true,
      })
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('handles localStorage.setItem throwing error', () => {
      const brokenLocalStorage = {
        getItem: jest.fn((key: string) => {
          if (key === DARK_MODE_KEY) return null
          return null
        }),
        setItem: jest.fn(() => { throw new Error('localStorage error') }),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0,
      }
      Object.defineProperty(window, 'localStorage', {
        value: brokenLocalStorage,
        writable: true,
      })
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList)
      const { result } = renderHook(() => useDarkMode())
      expect(() => {
        act(() => {
          result.current.setDarkMode('dark')
        })
      }).not.toThrow()
    })
  })

  describe('DOM class manipulation', () => {
    test('adds dark class to document when isDark is true', () => {
      const { result } = renderHook(() => useDarkMode())
      act(() => {
        result.current.setDarkMode('dark')
      })
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    test('removes dark class from document when isDark is false', () => {
      window.localStorage.setItem(DARK_MODE_KEY, 'dark')
      const { result } = renderHook(() => useDarkMode())
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      act(() => {
        result.current.setDarkMode('light')
      })
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('SSR safety', () => {
    test('handles window being undefined', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: undefined }).window

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.window = originalWindow
    })

    test('handles matchMedia being undefined', () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = undefined as unknown as typeof window.matchMedia

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      window.matchMedia = originalMatchMedia
    })
  })

  describe('Return value', () => {
    test('returns isDark, toggleDarkMode, setDarkMode, and mode', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current).toHaveProperty('isDark')
      expect(result.current).toHaveProperty('toggleDarkMode')
      expect(result.current).toHaveProperty('setDarkMode')
      expect(result.current).toHaveProperty('mode')
    })

    test('toggleDarkMode is a function', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(typeof result.current.toggleDarkMode).toBe('function')
    })

    test('setDarkMode is a function', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(typeof result.current.setDarkMode).toBe('function')
    })
  })
})
