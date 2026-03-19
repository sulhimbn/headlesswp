import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode', () => {
  const originalMatchMedia = window.matchMedia
  const mockMatchMedia = jest.fn()

  const mockAddEventListener = jest.fn()
  const mockRemoveEventListener = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  describe('Initial state with system preference', () => {
    test('returns isDark false when system preference is light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('system')
    })

    test('returns isDark true when system preference is dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Stored mode from localStorage', () => {
    test('uses stored light mode', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    test('uses stored dark mode', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    test('uses stored system mode when system is dark', () => {
      localStorage.setItem(DARK_MODE_KEY, 'system')
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
    })

    test('defaults to system when localStorage has invalid value', () => {
      localStorage.setItem(DARK_MODE_KEY, 'invalid-value')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })
  })

  describe('setDarkMode function', () => {
    test('sets light mode', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    test('sets dark mode', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    test('sets system mode to dark when system preference is dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('system')
    })

    test('sets system mode to light when system preference is light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('toggleDarkMode function', () => {
    test('toggles from dark to light', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    test('toggles from light to dark', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Media query listener', () => {
    test('updates isDark when system preference changes to dark in system mode', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      localStorage.setItem(DARK_MODE_KEY, 'system')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)

      act(() => {
        const changeHandler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'change'
        )?.[1]

        if (changeHandler) {
          changeHandler({ matches: true })
        }
      })

      expect(result.current.isDark).toBe(true)
    })

    test('updates isDark when system preference changes to light in system mode', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      localStorage.setItem(DARK_MODE_KEY, 'system')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(true)

      act(() => {
        const changeHandler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'change'
        )?.[1]

        if (changeHandler) {
          changeHandler({ matches: false })
        }
      })

      expect(result.current.isDark).toBe(false)
    })

    test('does not update isDark when in manual light mode', async () => {
      const { result, rerender } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)

      rerender()

      act(() => {
        const changeHandler = mockAddEventListener.mock.calls[1][1]
        changeHandler({ matches: true })
      })

      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('light')
    })

    test('removes event listener on unmount', () => {
      const { unmount } = renderHook(() => useDarkMode())

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    test('re-registers listener when mode changes', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { result, rerender } = renderHook(() => useDarkMode())

      expect(mockAddEventListener).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.setDarkMode('dark')
      })

      rerender()

      expect(mockAddEventListener).toHaveBeenCalledTimes(2)
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1)
    })
  })

  describe('SSR safety', () => {
    test('handles undefined window gracefully', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: undefined }).window

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.window = originalWindow
    })
  })
})
