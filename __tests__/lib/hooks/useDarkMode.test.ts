import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

describe('useDarkMode hook', () => {
  let mockGetItem: jest.Mock
  let mockSetItem: jest.Mock
  let mockClassListAdd: jest.Mock
  let mockClassListRemove: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockGetItem = jest.fn()
    mockSetItem = jest.fn()
    mockClassListAdd = jest.fn()
    mockClassListRemove = jest.fn()

    jest.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(mockGetItem)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(mockSetItem)

    const mockClassList = {
      add: mockClassListAdd,
      remove: mockClassListRemove,
    }
    
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns default mode as system', () => {
    mockGetItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBe('system')
  })

  test('returns isDark false by default when mode is system and system prefers light', () => {
    mockGetItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
  })

  test('returns isDark true when mode is dark', () => {
    mockGetItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(true)
  })

  test('returns isDark false when mode is light', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
  })

  test('setDarkMode updates mode and localStorage', () => {
    mockGetItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.setDarkMode('dark')
    })
    
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(mockSetItem).toHaveBeenCalledWith('dark-mode', 'dark')
  })

  test('setDarkMode to system uses system preference', () => {
    mockGetItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.setDarkMode('system')
    })
    
    expect(result.current.mode).toBe('system')
  })

  test('toggleDarkMode switches from light to dark', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.toggleDarkMode()
    })
    
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  test('toggleDarkMode switches from dark to light', () => {
    mockGetItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.toggleDarkMode()
    })
    
    expect(result.current.mode).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  test('adds dark class when isDark is true', () => {
    mockGetItem.mockReturnValue('dark')
    
    renderHook(() => useDarkMode())
    
    expect(mockClassListAdd).toHaveBeenCalledWith('dark')
  })

  test('removes dark class when isDark is false', () => {
    mockGetItem.mockReturnValue('light')
    
    renderHook(() => useDarkMode())
    
    expect(mockClassListRemove).toHaveBeenCalledWith('dark')
  })

  test('handles invalid stored mode defaults to system', () => {
    mockGetItem.mockReturnValue('invalid')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBe('system')
  })

  test('system preference listener updates isDark when mode is system', () => {
    mockGetItem.mockReturnValue('system')
    
    const matchMediaSpy = jest.spyOn(window, 'matchMedia')
    const mockMediaQueryList = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        mockMediaQueryList._handler = handler
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      _handler: undefined as ((e: MediaQueryListEvent) => void) | undefined,
    }
    matchMediaSpy.mockReturnValue(mockMediaQueryList as unknown as MediaQueryList)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
    
    mockMediaQueryList.matches = true
    act(() => {
      mockMediaQueryList._handler?.({ matches: true } as MediaQueryListEvent)
    })
    
    expect(result.current.isDark).toBe(true)
  })

  test('system preference listener does not update isDark when mode is dark', () => {
    mockGetItem.mockReturnValue('dark')
    
    const matchMediaSpy = jest.spyOn(window, 'matchMedia')
    const mockMediaQueryList = {
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        mockMediaQueryList._handler = handler
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      _handler: undefined as ((e: MediaQueryListEvent) => void) | undefined,
    }
    matchMediaSpy.mockReturnValue(mockMediaQueryList as unknown as MediaQueryList)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(true)
    
    mockMediaQueryList.matches = false
    act(() => {
      mockMediaQueryList._handler?.({ matches: false } as MediaQueryListEvent)
    })
    
    expect(result.current.isDark).toBe(true)
  })

  test('toggleDarkMode function is stable across renders', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result, rerender } = renderHook(() => useDarkMode())
    const firstToggle = result.current.toggleDarkMode
    
    rerender()
    
    expect(result.current.toggleDarkMode).toBe(firstToggle)
  })

  test('setDarkMode function is stable across renders', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result, rerender } = renderHook(() => useDarkMode())
    const firstSetDarkMode = result.current.setDarkMode
    
    rerender()
    
    expect(result.current.setDarkMode).toBe(firstSetDarkMode)
  })

  test('toggles multiple times correctly', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
    
    act(() => result.current.toggleDarkMode())
    expect(result.current.isDark).toBe(true)
    
    act(() => result.current.toggleDarkMode())
    expect(result.current.isDark).toBe(false)
    
    act(() => result.current.toggleDarkMode())
    expect(result.current.isDark).toBe(true)
  })

  test('transitions from system to dark correctly', () => {
    mockGetItem.mockReturnValue('system')
    
    const matchMediaSpy = jest.spyOn(window, 'matchMedia')
    matchMediaSpy.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as unknown as MediaQueryList)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBe('system')
    expect(result.current.isDark).toBe(false)
    
    act(() => result.current.setDarkMode('dark'))
    
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  test('transitions from dark to system and uses system preference', () => {
    mockGetItem.mockReturnValue('dark')
    
    const matchMediaSpy = jest.spyOn(window, 'matchMedia')
    matchMediaSpy.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as unknown as MediaQueryList)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    
    act(() => result.current.setDarkMode('system'))
    
    expect(result.current.mode).toBe('system')
    expect(result.current.isDark).toBe(false)
  })

  test('returns all required return properties', () => {
    mockGetItem.mockReturnValue('system')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current).toHaveProperty('isDark')
    expect(result.current).toHaveProperty('toggleDarkMode')
    expect(result.current).toHaveProperty('setDarkMode')
    expect(result.current).toHaveProperty('mode')
    expect(typeof result.current.toggleDarkMode).toBe('function')
    expect(typeof result.current.setDarkMode).toBe('function')
  })
})
