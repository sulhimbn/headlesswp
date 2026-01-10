import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'

describe('Footer Component', () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering - Footer Structure', () => {
    test('renders footer element', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    test('renders about section', () => {
      render(<Footer />)
      expect(screen.getByText('Mitra Banten News')).toBeInTheDocument()
      expect(screen.getByText(/Menyajikan berita terkini dan terpercaya dari Banten/)).toBeInTheDocument()
    })

    test('renders navigation section', () => {
      render(<Footer />)
      expect(screen.getByText('Navigasi')).toBeInTheDocument()
    })

    test('renders contact section', () => {
      render(<Footer />)
      expect(screen.getByText('Hubungi Kami')).toBeInTheDocument()
    })

    test('renders copyright section', () => {
      render(<Footer />)
      expect(screen.getByText(/2026 Mitra Banten News/)).toBeInTheDocument()
    })
  })

  describe('About Section', () => {
    test('renders about heading', () => {
      render(<Footer />)
      expect(screen.getByText('Mitra Banten News')).toBeInTheDocument()
    })

    test('renders about description', () => {
      render(<Footer />)
      expect(screen.getByText('Menyajikan berita terkini dan terpercaya dari Banten dan sekitarnya.')).toBeInTheDocument()
    })

    test('has about heading with proper id', () => {
      render(<Footer />)
      const aboutHeading = document.getElementById('footer-about-heading')
      expect(aboutHeading).toBeInTheDocument()
    })

    test('has about section with proper aria-labelledby', () => {
      const { container } = render(<Footer />)
      const aboutSection = container.querySelector('section[aria-labelledby="footer-about-heading"]')
      expect(aboutSection).toBeInTheDocument()
    })
  })

  describe('Navigation Section', () => {
    test('renders navigation heading', () => {
      render(<Footer />)
      expect(screen.getByText('Navigasi')).toBeInTheDocument()
    })

    test('renders all footer links', () => {
      render(<Footer />)
      const links = screen.getAllByRole('link', { name: 'Beranda' })
      expect(links.length).toBeGreaterThan(0)
      expect(screen.getAllByRole('link', { name: 'Berita' })).toHaveLength(1)
      expect(screen.getAllByRole('link', { name: 'Politik' })).toHaveLength(1)
      expect(screen.getAllByRole('link', { name: 'Ekonomi' })).toHaveLength(1)
      expect(screen.getAllByRole('link', { name: 'Olahraga' })).toHaveLength(1)
    })

    test('footer links have correct hrefs', () => {
      render(<Footer />)
      expect(screen.getAllByRole('link', { name: 'Beranda' })[0]).toHaveAttribute('href', '/')
      expect(screen.getAllByRole('link', { name: 'Berita' })[0]).toHaveAttribute('href', '/berita')
    })

    test('has navigation with proper aria-label', () => {
      render(<Footer />)
      const nav = screen.getByRole('navigation', { name: 'Navigasi Footer' })
      expect(nav).toBeInTheDocument()
    })

    test('has nav heading with proper id', () => {
      render(<Footer />)
      const navHeading = document.getElementById('footer-nav-heading')
      expect(navHeading).toBeInTheDocument()
    })

    test('navigation links are in unordered list', () => {
      const { container } = render(<Footer />)
      const ul = container.querySelector('ul')
      expect(ul).toBeInTheDocument()
    })
  })

  describe('Contact Section', () => {
    test('renders contact heading', () => {
      render(<Footer />)
      expect(screen.getByText('Hubungi Kami')).toBeInTheDocument()
    })

    test('renders email address', () => {
      render(<Footer />)
      expect(screen.getByText(/Email: info@mitrabantennews.com/)).toBeInTheDocument()
    })

    test('renders phone number', () => {
      render(<Footer />)
      expect(screen.getByText(/Telepon: \(0254\) 123-4567/)).toBeInTheDocument()
    })

    test('renders address', () => {
      render(<Footer />)
      expect(screen.getByText(/Alamat: Banten, Indonesia/)).toBeInTheDocument()
    })

    test('uses address element with not-italic', () => {
      const { container } = render(<Footer />)
      const address = container.querySelector('address.not-italic')
      expect(address).toBeInTheDocument()
    })

    test('has contact heading with proper id', () => {
      render(<Footer />)
      const contactHeading = document.getElementById('footer-contact-heading')
      expect(contactHeading).toBeInTheDocument()
    })

    test('has contact section with proper aria-labelledby', () => {
      const { container } = render(<Footer />)
      const contactSection = container.querySelector('section[aria-labelledby="footer-contact-heading"]')
      expect(contactSection).toBeInTheDocument()
    })
  })

  describe('Social Icons', () => {
    test('renders Facebook icon', () => {
      render(<Footer />)
      const facebook = screen.getByRole('link', { name: 'Facebook' })
      expect(facebook).toBeInTheDocument()
    })

    test('renders Twitter icon', () => {
      render(<Footer />)
      const twitter = screen.getByRole('link', { name: 'Twitter' })
      expect(twitter).toBeInTheDocument()
    })

    test('renders Instagram icon', () => {
      render(<Footer />)
      const instagram = screen.getByRole('link', { name: 'Instagram' })
      expect(instagram).toBeInTheDocument()
    })

    test('social icons have proper aria-labels', () => {
      render(<Footer />)
      const facebook = screen.getByRole('link', { name: 'Facebook' })
      const twitter = screen.getByRole('link', { name: 'Twitter' })
      const instagram = screen.getByRole('link', { name: 'Instagram' })
      
      expect(facebook).toHaveAccessibleName('Facebook')
      expect(twitter).toHaveAccessibleName('Twitter')
      expect(instagram).toHaveAccessibleName('Instagram')
    })

    test('social icons are in flex container', () => {
      const { container } = render(<Footer />)
      const flex = container.querySelector('.flex.space-x-4')
      expect(flex).toBeInTheDocument()
    })
  })

  describe('Copyright Section', () => {
    test('displays current year in copyright', () => {
      render(<Footer />)
      const copyrightElements = screen.getAllByText(/2026/)
      expect(copyrightElements.length).toBeGreaterThan(0)
    })

    test('copyright contains All rights reserved', () => {
      render(<Footer />)
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
    })

    test('has top border separator', () => {
      const { container } = render(<Footer />)
      const separator = container.querySelector('div.border-t')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for background', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('bg-[hsl(var(--color-background-dark))]')
    })

    test('uses design tokens for muted text', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('text-[hsl(var(--color-text-muted-dark))]')
    })

    test('uses design tokens for border color', () => {
      const { container } = render(<Footer />)
      const separator = container.querySelector('div.border-t')
      expect(separator).toHaveClass('border-[hsl(var(--color-surface-dark))]')
    })

    test('uses design tokens for faint text', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('text-[hsl(var(--color-text-muted-dark))]')
    })

    test('social icons use design tokens for color', () => {
      render(<Footer />)
      const facebook = screen.getByRole('link', { name: 'Facebook' })
      expect(facebook).toHaveClass('text-[hsl(var(--color-text-faint-dark))]')
    })

    test('social icons use design tokens for hover', () => {
      render(<Footer />)
      const facebook = screen.getByRole('link', { name: 'Facebook' })
      expect(facebook).toHaveClass('hover:text-white')
    })
  })

  describe('Layout and Spacing', () => {
    test('has proper grid layout', () => {
      const { container } = render(<Footer />)
      const grid = container.querySelector('.grid-cols-1.md\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    test('has proper max-width container', () => {
      const { container } = render(<Footer />)
      const containerDiv = container.querySelector('.max-w-7xl')
      expect(containerDiv).toBeInTheDocument()
    })

    test('has proper padding', () => {
      const { container } = render(<Footer />)
      const containerDiv = container.querySelector('.py-12')
      expect(containerDiv).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('footer has role="contentinfo"', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    test('all interactive elements have focus styles', () => {
      render(<Footer />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none')
        expect(link).toHaveClass('focus:ring-2')
      })
    })

    test('headings have proper IDs for aria-labelledby', () => {
      render(<Footer />)
      expect(document.getElementById('footer-about-heading')).toBeInTheDocument()
      expect(document.getElementById('footer-nav-heading')).toBeInTheDocument()
      expect(document.getElementById('footer-contact-heading')).toBeInTheDocument()
    })

    test('sections have proper aria-labelledby attributes', () => {
      const { container } = render(<Footer />)
      
      const aboutSection = container.querySelector('section[aria-labelledby="footer-about-heading"]')
      const navSection = container.querySelector('section[aria-labelledby="footer-nav-heading"]')
      const contactSection = container.querySelector('section[aria-labelledby="footer-contact-heading"]')
      
      expect(aboutSection).toBeInTheDocument()
      expect(navSection).toBeInTheDocument()
      expect(contactSection).toBeInTheDocument()
    })

    test('nav has aria-label for footer navigation', () => {
      render(<Footer />)
      const nav = screen.getByRole('navigation', { name: 'Navigasi Footer' })
      expect(nav).toHaveAccessibleName('Navigasi Footer')
    })

    test('social links have proper aria-labels', () => {
      render(<Footer />)
      const facebook = screen.getByRole('link', { name: 'Facebook' })
      const twitter = screen.getByRole('link', { name: 'Twitter' })
      const instagram = screen.getByRole('link', { name: 'Instagram' })
      
      expect(facebook).toHaveAccessibleName('Facebook')
      expect(twitter).toHaveAccessibleName('Twitter')
      expect(instagram).toHaveAccessibleName('Instagram')
    })
  })

  describe('Responsive Layout', () => {
    test('navigation links are in unordered list', () => {
      const { container } = render(<Footer />)
      const ul = container.querySelector('ul')
      expect(ul).toBeInTheDocument()
    })

    test('social icons are in flex container', () => {
      const { container } = render(<Footer />)
      const flex = container.querySelector('.flex.space-x-4')
      expect(flex).toBeInTheDocument()
    })

    test('uses flex layout for copyright and social', () => {
      const { container } = render(<Footer />)
      const flex = container.querySelector('.md\\:flex-row')
      expect(flex).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles footer when year changes', () => {
      const { rerender } = render(<Footer />)
      
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2027)
      rerender(<Footer />)
      
      expect(screen.getByText(/2027/)).toBeInTheDocument()
    })
  })
})
