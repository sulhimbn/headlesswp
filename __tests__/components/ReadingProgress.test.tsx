import { render, waitFor } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
}))

describe('ReadingProgress', () => {
  const originalWindow = global.window
  const originalDocument = global.document

  beforeEach(() => {
    jest.useFakeTimers()
    
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
    
    const mockElement = document.createElement('div')
    mockElement.id = 'article-content'
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
    
    window.scrollY = 0
    document.body.innerHTML = ''
  })

  it('renders null when progress is 0', () => {
    const { container } = render(<ReadingProgress />)
    expect(container.firstChild).toBeNull()
  })

  it('renders progress bar when there is scroll progress', async () => {
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
    
    const { getByRole } = render(<ReadingProgress />)
    
    jest.advanceTimersByTime(200)
    
    await waitFor(() => {
      const progressbar = getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  it('displays correct progress percentage', async () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
    
    const { getByRole } = render(<ReadingProgress />)
    
    jest.advanceTimersByTime(200)
    
    await waitFor(() => {
      const progressbar = getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    })
  })

  it('handles no scroll (edge case)', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 800, writable: true })
    
    const { container } = render(<ReadingProgress />)
    
    jest.advanceTimersByTime(200)
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('handles max scroll (edge case)', async () => {
    Object.defineProperty(window, 'scrollY', { value: 1200, writable: true })
    
    const { getByRole } = render(<ReadingProgress />)
    
    jest.advanceTimersByTime(200)
    
    await waitFor(() => {
      const progressbar = getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    })
  })

  it('uses custom targetId when provided', async () => {
    const mockElement = document.createElement('div')
    mockElement.id = 'custom-content'
    document.body.appendChild(mockElement)
    
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
    
    const { getByRole } = render(<ReadingProgress targetId="custom-content" />)
    
    jest.advanceTimersByTime(200)
    
    await waitFor(() => {
      expect(getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('has correct accessibility attributes', async () => {
    Object.defineProperty(window, 'scrollY', { value: 333, writable: true })
    
    const { getByRole } = render(<ReadingProgress />)
    
    jest.advanceTimersByTime(200)
    
    await waitFor(() => {
      const progressbar = getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-label', 'Kemajuan membaca')
    })
  })
})