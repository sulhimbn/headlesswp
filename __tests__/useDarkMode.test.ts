import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode Hook', () => {
  let localStorageData: { [key: string]: string }

  beforeEach(() => {
    localStorageData = {}
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageData[key] || null),
        setItem: jest.fn((key: string, value: string) => { localStorageData[key] = value }),
        removeItem: jest.fn((key: string) => { delete localStorageData[key] }),
      },
      writable: true,
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    })
  })

  describe('Initial State', () => {
    test('returns dark mode when system prefers dark', () => {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })

    test('returns light mode when system prefers light', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: false,
          media: '',
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      })

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('uses stored dark mode from localStorage', () => {
      localStorageData[DARK_MODE_KEY] = 'dark'
      
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')
    })

    test('uses stored light mode from localStorage', () => {
      localStorageData[DARK_MODE_KEY] = 'light'
      
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('light')
    })

    test('defaults to system mode when localStorage has invalid value', () => {
      localStorageData[DARK_MODE_KEY] = 'invalid'
      
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
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
      expect(window.localStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
    })

    test('sets mode to light', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(window.localStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'light')
    })

    test('sets mode to system and follows system preference', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
      expect(window.localStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'system')
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: false,
          media: '',
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      })

      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.isDark).toBe(true)
      expect(result.current.mode).toBe('dark')
    })

    test('toggles from dark to light', () => {
      localStorageData[DARK_MODE_KEY] = 'dark'
      
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.isDark).toBe(false)
      expect(result.current.mode).toBe('light')
    })
  })

  describe('Dark Mode Class', () => {
    test('adds dark class to document when isDark becomes true', () => {
      const classListMock = {
        add: jest.fn(),
        remove: jest.fn(),
      }
      
      Object.defineProperty(document.documentElement, 'classList', {
        value: classListMock,
        writable: true,
      })

      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(classListMock.add).toHaveBeenCalledWith('dark')
    })

    test('removes dark class from document when isDark becomes false', () => {
      localStorageData[DARK_MODE_KEY] = 'dark'
      
      const classListMock = {
        add: jest.fn(),
        remove: jest.fn(),
      }
      
      Object.defineProperty(document.documentElement, 'classList', {
        value: classListMock,
        writable: true,
      })

      const { result } = renderHook(() => useDarkMode())
      classListMock.add.mockClear()
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(classListMock.remove).toHaveBeenCalledWith('dark')
    })
  })
})
