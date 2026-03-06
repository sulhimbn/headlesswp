import { render } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    test('renders without crashing when scrolled', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, writable: true })

      const { asFragment } = render(<ReadingProgress targetId="test-content" />)
      expect(asFragment()).toBeDefined()
    })

    test('renders without crashing with default targetId', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, writable: true })

      const { asFragment } = render(<ReadingProgress />)
      expect(asFragment()).toBeDefined()
    })
  })

  describe('Component exists', () => {
    test('component renders successfully', () => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, writable: true })

      const { asFragment } = render(<ReadingProgress />)
      expect(asFragment()).toBeDefined()
    })
  })
})
