import { render } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  describe('Rendering', () => {
    test('renders component without crashing', () => {
      const { container } = render(<ReadingProgress />)
      expect(container).toBeInTheDocument()
    })

    test('renders with default targetId', () => {
      const { container } = render(<ReadingProgress />)
      expect(container).toBeInTheDocument()
    })

    test('renders with custom targetId', () => {
      const { container } = render(<ReadingProgress targetId="custom-id" />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    test('accepts targetId prop', () => {
      render(<ReadingProgress targetId="test-id" />)
    })

    test('uses default targetId when not provided', () => {
      render(<ReadingProgress />)
    })
  })

  describe('Edge Cases', () => {
    test('handles empty targetId', () => {
      render(<ReadingProgress targetId="" />)
    })

    test('handles special characters in targetId', () => {
      render(<ReadingProgress targetId="test-id-123" />)
    })

    test('handles numeric targetId', () => {
      render(<ReadingProgress targetId="123" />)
    })
  })
})