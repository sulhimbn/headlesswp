import { render, screen } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
  })

  test('renders null when progress is 0', () => {
    const { container } = render(<ReadingProgress />)
    expect(container.firstChild).toBeNull()
  })

  test('renders null when target element does not exist', () => {
    const getElementByIdMock = jest.fn().mockReturnValue(null)
    document.getElementById = getElementByIdMock

    const { container } = render(<ReadingProgress />)
    expect(container.firstChild).toBeNull()
  })

  test('handles zero document height gracefully', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    
    const { container } = render(<ReadingProgress />)
    expect(container.firstChild).toBeNull()
  })

  test('uses default targetId when not provided', () => {
    const getElementByIdMock = jest.fn().mockReturnValue({
      scrollHeight: 1000,
    })
    document.getElementById = getElementByIdMock

    render(<ReadingProgress />)
    
    expect(getElementByIdMock).toHaveBeenCalledWith('article-content')
  })

  test('renders with custom targetId', () => {
    const getElementByIdMock = jest.fn().mockReturnValue({
      scrollHeight: 1000,
    })
    document.getElementById = getElementByIdMock

    render(<ReadingProgress targetId="custom-article" />)
    
    expect(getElementByIdMock).toHaveBeenCalledWith('custom-article')
  })
})
