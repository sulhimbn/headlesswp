import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('useDarkMode', () => {
  let originalWindow: typeof window
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    originalWindow = global.window
    originalMatchMedia = window.matchMedia

    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      return {
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
    })
  })

  afterEach(() => {
    global.window = originalWindow
    window.matchMedia = originalMatchMedia
  })

  describe('Initial state', () => {
    test('initializes with system mode and false isDark when no stored value', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })

    test('initializes with stored light mode', () => {
      mockLocalStorage.getItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('initializes with stored dark mode', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('initializes with stored system mode', () => {
      mockLocalStorage.getItem.mockReturnValue('system')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })

    test('falls back to system for invalid stored values', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })
  })

  describe('setDarkMode', () => {
    test('sets mode to light and updates isDark', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('light')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'light')
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('sets mode to dark and updates isDark', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('dark')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('sets mode to system and uses system preference', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('system')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'system')
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', async () => {
      mockLocalStorage.getItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('toggles from dark to light', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('System preference detection', () => {
    test('detects system dark mode preference', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(true)
    })

    test('detects system light mode preference', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)
    })
  })

  describe('Persistence', () => {
    test('persists light mode to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('light')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'light')
    })

    test('persists dark mode to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('dark')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
    })

    test('persists system mode to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await act(async () => {
        result.current.setDarkMode('system')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'system')
    })
  })

  describe('Document class manipulation', () => {
    let mockAdd: jest.Mock
    let mockRemove: jest.Mock

    beforeEach(() => {
      mockAdd = jest.fn()
      mockRemove = jest.fn()
      jest.spyOn(document.documentElement.classList, 'add').mockImplementation(mockAdd)
      jest.spyOn(document.documentElement.classList, 'remove').mockImplementation(mockRemove)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('adds dark class when isDark is true', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark')

      renderHook(() => useDarkMode())

      expect(mockAdd).toHaveBeenCalledWith('dark')
    })

    test('removes dark class when isDark is false', async () => {
      mockLocalStorage.getItem.mockReturnValue('light')

      renderHook(() => useDarkMode())

      expect(mockRemove).toHaveBeenCalledWith('dark')
    })
  })

  describe('SSR safety', () => {
    test('handles undefined window (SSR)', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: typeof window }).window

      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()

      global.window = originalWindow
    })

    test('returns correct initial state in SSR', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: typeof window }).window

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)

      global.window = originalWindow
    })

    test('getSystemPreference returns false when window is undefined', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: typeof window }).window

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)

      global.window = originalWindow
    })
  })

  describe('getStoredMode function behavior', () => {
    test('returns system when localStorage returns null', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })

    test('returns stored value when valid', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('dark')
    })

    test('returns system when localStorage returns empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })
  })

  describe('Media query listener', () => {
    test('listens for system preference changes when in system mode', () => {
      const mockAddEventListener = jest.fn()
      const mockRemoveEventListener = jest.fn()
      
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })
      mockLocalStorage.getItem.mockReturnValue('system')

      renderHook(() => useDarkMode())

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    test('updates isDark when system preference changes in system mode', async () => {
      let changeHandler: ((e: { matches: boolean }) => void) | null = null

      const mockAddEventListener = jest.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
        changeHandler = handler
      })
      const mockRemoveEventListener = jest.fn()

      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })
      mockLocalStorage.getItem.mockReturnValue('system')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)

      await act(async () => {
        if (changeHandler) {
          changeHandler({ matches: true })
        }
      })

      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Edge cases', () => {
    test('handles all valid mode values', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      const modes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']

      for (const mode of modes) {
        await act(async () => {
          result.current.setDarkMode(mode)
        })
        expect(result.current.mode).toBe(mode)
      }
    })

    test('maintains isDark state correctly after multiple toggles', async () => {
      mockLocalStorage.getItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)

      await act(async () => {
        result.current.toggleDarkMode()
      })
      expect(result.current.isDark).toBe(true)

      await act(async () => {
        result.current.toggleDarkMode()
      })
      expect(result.current.isDark).toBe(false)
    })
  })
})
