import { render, screen } from '@testing-library/react'
import OptimizedImage from '@/components/ui/OptimizedImage'

const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

jest.mock('@/lib/utils/mediaOptimizer', () => ({
  getMediaSizes: jest.fn().mockReturnValue('(max-width: 640px) 100vw, 50vw'),
  trackImageLoad: jest.fn(),
}))

describe('OptimizedImage', () => {
  const mockSrc = 'https://example.com/image.jpg'
  const mockAlt = 'Test image'

  beforeEach(() => {
    jest.clearAllMocks()
    mockIntersectionObserver.mockClear()
  })

  it('renders with correct alt text when loaded', () => {
    render(<OptimizedImage src={mockSrc} alt={mockAlt} width={800} height={600} priority />)
    const img = document.querySelector('img')
    expect(img?.getAttribute('alt')).toBe(mockAlt)
  })

  it('renders without pulse class when priority is true', () => {
    render(<OptimizedImage src={mockSrc} alt={mockAlt} width={800} height={600} priority />)
    expect(document.querySelector('.animate-pulse')).toBeNull()
  })

  it('applies custom className', () => {
    const customClass = 'custom-class'
    render(<OptimizedImage src={mockSrc} alt={mockAlt} width={800} height={600} className={customClass} />)
    expect(document.querySelector(`.${customClass}`)).toBeTruthy()
  })

  it('renders with fill prop', () => {
    render(<OptimizedImage src={mockSrc} alt={mockAlt} fill priority />)
    const container = document.querySelector('.relative')
    expect(container).toBeTruthy()
  })

  it('renders with custom sizes when priority', () => {
    const customSizes = '50vw'
    render(<OptimizedImage src={mockSrc} alt={mockAlt} width={800} height={600} sizes={customSizes} priority />)
    const img = document.querySelector('img')
    expect(img?.getAttribute('sizes')).toBe(customSizes)
  })

  it('uses intersection observer for non-priority images', () => {
    render(<OptimizedImage src={mockSrc} alt={mockAlt} width={800} height={600} priority={false} />)
    expect(mockIntersectionObserver).toHaveBeenCalled()
  })
})
