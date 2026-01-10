import { render } from '@testing-library/react'
import { Icon } from '@/components/ui/Icon'

describe('Icon Component', () => {
  const getSvg = (container: HTMLElement) => container.querySelector('svg')

  describe('Rendering', () => {
    test('renders facebook icon', () => {
      const { container } = render(<Icon type="facebook" />)
      const svg = getSvg(container)
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders twitter icon', () => {
      const { container } = render(<Icon type="twitter" />)
      const svg = getSvg(container)
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders instagram icon', () => {
      const { container } = render(<Icon type="instagram" />)
      const svg = getSvg(container)
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    test('renders close icon', () => {
      const { container } = render(<Icon type="close" />)
      const svg = getSvg(container)
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'none')
    })

    test('renders menu icon', () => {
      const { container } = render(<Icon type="menu" />)
      const svg = getSvg(container)
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'none')
    })
  })

  describe('SVG Attributes', () => {
    test('all icons have correct viewBox', () => {
      const { container } = render(<Icon type="facebook" />)
      const svg = getSvg(container)
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    test('applies custom className', () => {
      const { container } = render(<Icon type="facebook" className="custom-class" />)
      const svg = getSvg(container)
      expect(svg).toHaveClass('custom-class')
    })

    test('hides icon from screen readers by default', () => {
      const { container } = render(<Icon type="facebook" />)
      const svg = getSvg(container)
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    test('shows icon to screen readers when aria-hidden is false', () => {
      const { container } = render(<Icon type="facebook" aria-hidden={false} />)
      const svg = getSvg(container)
      expect(svg).toHaveAttribute('aria-hidden', 'false')
    })
  })

  describe('Icon Paths', () => {
    test('facebook icon has path', () => {
      const { container } = render(<Icon type="facebook" />)
      const svg = getSvg(container)
      if (!svg) throw new Error('SVG not found')
      const paths = svg.querySelectorAll('path')
      expect(paths).toHaveLength(1)
      expect(paths[0]).toHaveAttribute('fill-rule', 'evenodd')
    })

    test('twitter icon has path', () => {
      const { container } = render(<Icon type="twitter" />)
      const svg = getSvg(container)
      if (!svg) throw new Error('SVG not found')
      const paths = svg.querySelectorAll('path')
      expect(paths).toHaveLength(1)
    })

    test('instagram icon has path', () => {
      const { container } = render(<Icon type="instagram" />)
      const svg = getSvg(container)
      if (!svg) throw new Error('SVG not found')
      const paths = svg.querySelectorAll('path')
      expect(paths).toHaveLength(1)
      expect(paths[0]).toHaveAttribute('fill-rule', 'evenodd')
    })

    test('close icon has stroke path', () => {
      const { container } = render(<Icon type="close" />)
      const svg = getSvg(container)
      if (!svg) throw new Error('SVG not found')
      const paths = svg.querySelectorAll('path')
      expect(paths).toHaveLength(1)
      const path = paths[0]
      if (!path) throw new Error('Path not found')
      expect(path).toHaveAttribute('stroke-linecap', 'round')
      expect(path).toHaveAttribute('stroke-linejoin', 'round')
      expect(path).toHaveAttribute('stroke-width', '2')
    })

    test('menu icon has single path with 3 lines', () => {
      const { container } = render(<Icon type="menu" />)
      const svg = getSvg(container)
      if (!svg) throw new Error('SVG not found')
      const paths = svg.querySelectorAll('path')
      expect(paths).toHaveLength(1)
      const path = paths[0]
      if (!path) throw new Error('Path not found')
      expect(path).toHaveAttribute('stroke-linecap', 'round')
      expect(path).toHaveAttribute('stroke-linejoin', 'round')
      expect(path).toHaveAttribute('stroke-width', '2')
      expect(path).toHaveAttribute('d', 'M4 6h16M4 12h16M4 18h16')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty className', () => {
      const { container } = render(<Icon type="facebook" className="" />)
      const svg = getSvg(container)
      expect(svg).toBeInTheDocument()
    })
  })
})
