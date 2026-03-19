import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn((callback: FrameRequestCallback) => {
    callback(0)
    return 0
  }),
  writable: true,
})

describe('ReadingProgress Component', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    window.scrollY = 0
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  test('does not render when progress is 0', () => {
    Object.defineProperty(document, 'documentElement', {
      value: { scrollHeight: 1000 },
      writable: true,
    })
    render(<ReadingProgress />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('adds scroll event listener', () => {
    Object.defineProperty(document, 'documentElement', {
      value: { scrollHeight: 2000 },
      writable: true,
    })
    render(<ReadingProgress />)
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
  })

  test('adds resize event listener', () => {
    Object.defineProperty(document, 'documentElement', {
      value: { scrollHeight: 2000 },
      writable: true,
    })
    render(<ReadingProgress />)
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
  })

  test('removes event listeners on unmount', () => {
    Object.defineProperty(document, 'documentElement', {
      value: { scrollHeight: 2000 },
      writable: true,
    })
    const { unmount } = render(<ReadingProgress />)
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  test('uses default targetId', () => {
    const getElementByIdSpy = jest.spyOn(document, 'getElementById')
    Object.defineProperty(document, 'documentElement', {
      value: { scrollHeight: 2000 },
      writable: true,
    })
    render(<ReadingProgress />)
    expect(getElementByIdSpy).toHaveBeenCalledWith('article-content')
  })

  test('uses custom targetId', () => {
    const getElementByIdSpy = jest.spyOn(document, 'getElementById')
    Object.defineProperty(document, 'documentElement', {
      value: { scrollHeight: 2000 },
      writable: true,
    })
    render(<ReadingProgress targetId="custom-content" />)
    expect(getElementByIdSpy).toHaveBeenCalledWith('custom-content')
  })
})
