import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

const mockMatchMedia = {
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)' ? mockMatchMedia.matches : false,
    addEventListener: mockMatchMedia.addEventListener,
    removeEventListener: mockMatchMedia.removeEventListener,
  })),
  writable: true,
})

describe('useDarkMode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    document.documentElement.classList.remove('dark')
    mockMatchMedia.addEventListener.mockClear()
    mockMatchMedia.removeEventListener.mockClear()
  })

  describe('initialization', () => {
    it('should initialize with system mode by default', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })

    it('should read mode from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
    })

    it('should set isDark to true when mode is dark', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(true)
    })

    it('should set isDark to false when mode is light', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(false)
    })

    it('should use system preference when mode is system', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      mockMatchMedia.matches = true
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('setDarkMode', () => {
    it('should update mode when setDarkMode is called', async () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('dark')
      })
      
      expect(result.current.mode).toBe('dark')
    })

    it('should persist mode to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('dark')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    it('should set isDark to true when mode is dark', async () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('dark')
      })
      
      expect(result.current.isDark).toBe(true)
    })

    it('should set isDark to false when mode is light', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('light')
      })
      
      expect(result.current.isDark).toBe(false)
    })

    it('should use system preference when mode is system', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      mockMatchMedia.matches = true
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('system')
      })
      
      expect(result.current.mode).toBe('system')
    })
  })

  describe('toggleDarkMode', () => {
    it('should toggle from dark to light', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('light')
    })

    it('should toggle from light to dark', async () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('dark')
    })
  })

  describe('CSS class', () => {
    it('should add dark class when isDark is true', async () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      mockMatchMedia.matches = true
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('dark')
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when isDark is false', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      document.documentElement.classList.add('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      await act(async () => {
        result.current.setDarkMode('light')
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('return value', () => {
    it('should return isDark, toggleDarkMode, setDarkMode, and mode', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current).toHaveProperty('isDark')
      expect(result.current).toHaveProperty('toggleDarkMode')
      expect(result.current).toHaveProperty('setDarkMode')
      expect(result.current).toHaveProperty('mode')
    })
  })
})
