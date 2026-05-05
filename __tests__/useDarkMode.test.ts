import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode', () => {
  let mockMatchMedia: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockMatchMedia = jest.fn()
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })

    document.documentElement.classList.remove('dark')
  })

  describe('getSystemPreference', () => {
    test('returns false when window is undefined (SSR)', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('detects dark system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      act(() => {})
      expect(result.current.isDark).toBe(true)
    })

    test('detects light system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      act(() => {})
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('getStoredMode - localStorage persistence', () => {
    test('returns system when no stored value', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('reads dark mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('reads light mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('reads system mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'system')

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('falls back to system for invalid stored value', () => {
      localStorage.setItem(DARK_MODE_KEY, 'invalid')

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })
  })

  describe('setDarkMode', () => {
    test('sets dark mode and persists to localStorage', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')
    })

    test('sets light mode and persists to localStorage', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('light')
    })

    test('sets system mode and uses system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('system')
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })

    test('toggles from dark to light', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
    })
  })

  describe('theme switching', () => {
    test('adds dark class to document when dark mode is enabled', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    test('removes dark class from document when light mode is enabled', () => {
      document.documentElement.classList.add('dark')

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('system preference listener', () => {
    test('updates when system preference changes while in system mode', () => {
      const addEventListenerMock = jest.fn()
      const removeEventListenerMock = jest.fn()

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      })

      const { result } = renderHook(() => useDarkMode())

      expect(addEventListenerMock).toHaveBeenCalled()
      
      const callback = addEventListenerMock.mock.calls[0][1]
      
      const mockEvent = { matches: true }
      act(() => {
        callback(mockEvent as MediaQueryListEvent)
      })

      expect(result.current.isDark).toBe(true)
    })

    test('does not update when system preference changes while in manual mode', () => {
      const addEventListenerMock = jest.fn()
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      const callback = addEventListenerMock.mock.calls[0][1]
      
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: addEventListenerMock,
        removeEventListener: jest.fn(),
      })

      const mockEvent = { matches: true }
      act(() => {
        callback(mockEvent as MediaQueryListEvent)
      })

      expect(result.current.isDark).toBe(true)
    })
  })

  describe('SSR safety', () => {
    test('does not throw when window is undefined', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: undefined }).window

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.window = originalWindow
    })
  })
})