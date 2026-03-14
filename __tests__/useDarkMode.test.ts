import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

describe('useDarkMode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should have default values', () => {
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBeDefined()
    expect(typeof result.current.isDark).toBe('boolean')
    expect(typeof result.current.setDarkMode).toBe('function')
    expect(typeof result.current.toggleDarkMode).toBe('function')
  })

  it('should set mode to dark', async () => {
    const { result } = renderHook(() => useDarkMode())
    
    await act(async () => {
      result.current.setDarkMode('dark')
    })

    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('should set mode to light', async () => {
    const { result } = renderHook(() => useDarkMode())
    
    await act(async () => {
      result.current.setDarkMode('light')
    })

    expect(result.current.mode).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('should set mode to system', async () => {
    const { result } = renderHook(() => useDarkMode())
    
    await act(async () => {
      result.current.setDarkMode('system')
    })

    expect(result.current.mode).toBe('system')
  })

  it('should toggle mode', async () => {
    const { result } = renderHook(() => useDarkMode())
    
    await act(async () => {
      result.current.setDarkMode('light')
    })

    const initialMode = result.current.mode
    
    await act(async () => {
      result.current.toggleDarkMode()
    })

    expect(result.current.mode).not.toBe(initialMode)
  })
})
