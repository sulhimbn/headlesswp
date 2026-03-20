import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

const originalWindow = global.window
const mockMatchMedia = (matches: boolean) => {
  const listeners: ((e: MediaQueryListEvent) => void)[] = []
  return {
    matches,
    addEventListener: jest.fn((_: string, callback: (e: MediaQueryListEvent) => void) => {
      listeners.push(callback)
    }),
    removeEventListener: jest.fn(),
    _trigger: (matches: boolean) => {
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent))
    },
  }
}

describe('useDarkMode', () => {
  let mockMediaQuery: ReturnType<typeof mockMatchMedia>

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockMediaQuery = mockMatchMedia(false)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockMediaQuery),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalWindow.matchMedia,
    })
  })

  describe('Initial state', () => {
    test('returns correct initial values', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
      expect(result.current.toggleDarkMode).toBeDefined()
      expect(result.current.setDarkMode).toBeDefined()
    })

    test('returns dark mode true when system prefers dark', () => {
      mockMediaQuery = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMediaQuery),
      })

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('System preference detection', () => {
    test('detects system dark mode preference', () => {
      mockMediaQuery = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMediaQuery),
      })

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })

    test('detects system light mode preference', () => {
      mockMediaQuery = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMediaQuery),
      })

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('responds to system preference changes when mode is system', () => {
      mockMediaQuery = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMediaQuery),
      })

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)

      act(() => {
        mockMediaQuery._trigger(true)
      })

      expect(result.current.isDark).toBe(true)
    })

    test('ignores system preference changes when mode is not system', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')

      act(() => {
        mockMediaQuery._trigger(false)
      })

      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')
    })
  })

  describe('Toggle functionality', () => {
    test('toggles from light to dark', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')
    })

    test('toggles from dark to light', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.isDark).toBe(true)

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('light')
    })

    test('multiple toggles work correctly', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => result.current.toggleDarkMode())
      expect(result.current.isDark).toBe(true)

      act(() => result.current.toggleDarkMode())
      expect(result.current.isDark).toBe(false)

      act(() => result.current.toggleDarkMode())
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('setDarkMode', () => {
    test('sets mode to dark', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('sets mode to light', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('sets mode to system and respects system preference', () => {
      mockMediaQuery = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMediaQuery),
      })

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.isDark).toBe(true)

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('localStorage persistence', () => {
    test('persists mode to localStorage', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })

    test('reads stored mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('returns system for invalid stored value', () => {
      localStorage.setItem(DARK_MODE_KEY, 'invalid')

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('persists toggle to localStorage', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })
  })

  describe('localStorage unavailable scenarios', () => {
    const originalLocalStorage = global.localStorage

    beforeEach(() => {
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(null),
          setItem: jest.fn().mockImplementation(() => {
            throw new Error('QuotaExceededError')
          }),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    })

    test('mode defaults to system when localStorage returns null', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('toggle changes mode even if setItem throws', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Hydration mismatch / SSR safety', () => {
    test('handles undefined window gracefully', () => {
      const originalWindow = global.window
      ;(global as unknown as { window?: undefined }).window = undefined

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.window = originalWindow
    })

    test('initial render returns false for isDark (SSR safe)', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('classList is not manipulated during SSR', () => {
      const classListSpy = jest.spyOn(document.documentElement.classList, 'remove')

      renderHook(() => useDarkMode())

      expect(classListSpy).toHaveBeenCalledWith('dark')
      classListSpy.mockRestore()
    })

    test('adds dark class when isDark becomes true', () => {
      const classListSpy = jest.spyOn(document.documentElement.classList, 'add')

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(classListSpy).toHaveBeenCalledWith('dark')
      classListSpy.mockRestore()
    })
  })

  describe('Theme persistence across page loads', () => {
    test('restores dark mode preference on rerender', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')

      const { result, rerender } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)

      rerender()

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('restores light mode preference on rerender', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')

      const { result, rerender } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)

      rerender()

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('restores system mode preference on rerender', () => {
      localStorage.setItem(DARK_MODE_KEY, 'system')

      const { result, rerender } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')

      rerender()

      expect(result.current.mode).toBe('system')
    })

    test('system mode with dark preference persists across rerender', () => {
      mockMediaQuery = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMediaQuery),
      })

      localStorage.setItem(DARK_MODE_KEY, 'system')

      const { result, rerender } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)

      rerender()

      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Media query listener cleanup', () => {
    test('removes event listener on cleanup', () => {
      const { unmount } = renderHook(() => useDarkMode())

      unmount()

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    test('updates listener when mode changes', () => {
      const { result, rerender } = renderHook(() => useDarkMode())

      const initialRemoveCount = mockMediaQuery.removeEventListener.mock.calls.length
      const initialAddCount = mockMediaQuery.addEventListener.mock.calls.length

      act(() => {
        result.current.setDarkMode('dark')
      })

      rerender()

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledTimes(initialRemoveCount + 1)
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledTimes(initialAddCount + 1)
    })
  })

  describe('Return value shape', () => {
    test('returns all expected properties', () => {
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
