import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/layout/Header'

describe('Header Component', () => {
  describe('Rendering - Desktop Navigation', () => {
    test('renders header element', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    test('renders logo link to home', () => {
      render(<Header />)
      const logo = screen.getByRole('link', { name: /Mitra Banten News Beranda/ })
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('href', '/')
    })

    test('renders logo text', () => {
      render(<Header />)
      expect(screen.getByText('Mitra Banten News')).toBeInTheDocument()
    })

    test('renders all navigation items on desktop', () => {
      render(<Header />)
      
      expect(screen.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Berita' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Politik' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ekonomi' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Olahraga' })).toBeInTheDocument()
    })

    test('navigation items have correct hrefs', () => {
      render(<Header />)
      
      expect(screen.getByRole('link', { name: 'Beranda' })).toHaveAttribute('href', '/')
      expect(screen.getByRole('link', { name: 'Berita' })).toHaveAttribute('href', '/berita')
      expect(screen.getByRole('link', { name: 'Politik' })).toHaveAttribute('href', '/politik')
      expect(screen.getByRole('link', { name: 'Ekonomi' })).toHaveAttribute('href', '/ekonomi')
      expect(screen.getByRole('link', { name: 'Olahraga' })).toHaveAttribute('href', '/olahraga')
    })
  })

  describe('Mobile Menu Button', () => {
    test('renders menu button on mobile', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      expect(menuButton).toBeInTheDocument()
    })

    test('menu button has correct aria attributes when closed', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
      expect(menuButton).toHaveAttribute('aria-haspopup', 'true')
    })

    test('menu button shows close icon when menu is open', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      expect(screen.getByRole('button', { name: 'Tutup menu' })).toBeInTheDocument()
    })

    test('menu button has correct aria-expanded when open', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Mobile Menu - Toggle', () => {
    test('opens mobile menu when button is clicked', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const mobileMenu = document.getElementById('mobile-menu')
      expect(mobileMenu).toBeInTheDocument()
    })

    test('closes mobile menu when close button is clicked', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const closeButton = screen.getByRole('button', { name: 'Tutup menu' })
      fireEvent.click(closeButton)
      
      expect(document.getElementById('mobile-menu')).not.toBeInTheDocument()
    })

    test('closes mobile menu when Escape key is pressed', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const mobileMenu = document.getElementById('mobile-menu')
      if (mobileMenu) {
        fireEvent.keyDown(mobileMenu, { key: 'Escape' })
      }
      
      expect(document.getElementById('mobile-menu')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Menu - Navigation Items', () => {
    test('renders all navigation items in mobile menu', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const mobileMenu = document.getElementById('mobile-menu')
      expect(mobileMenu).toBeInTheDocument()
      
      expect(screen.getAllByRole('link', { name: 'Beranda' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Berita' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Politik' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Ekonomi' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Olahraga' })).toHaveLength(2)
    })

    test('closes mobile menu when navigation item is clicked', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const beritaLinks = screen.getAllByRole('link', { name: 'Berita' })
      const mobileBeritaLink = beritaLinks[1]
      fireEvent.click(mobileBeritaLink)
      
      expect(document.getElementById('mobile-menu')).not.toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation - Tab Trap', () => {
    test('wraps focus to last menu item when Tab pressed on first item', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const firstMenuItems = screen.getAllByRole('link', { name: 'Beranda' })
      const firstMenuItem = firstMenuItems[1]
      firstMenuItem.focus()
      
      fireEvent.keyDown(firstMenuItem, { key: 'Tab', shiftKey: true })
      
      const lastMenuItems = screen.getAllByRole('link', { name: 'Olahraga' })
      const lastMenuItem = lastMenuItems[1]
      expect(lastMenuItem).toHaveFocus()
    })

    test('wraps focus to first menu item when Tab pressed on last item', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const lastMenuItems = screen.getAllByRole('link', { name: 'Olahraga' })
      const lastMenuItem = lastMenuItems[1]
      lastMenuItem.focus()
      
      fireEvent.keyDown(lastMenuItem, { key: 'Tab' })
      
      const firstMenuItems = screen.getAllByRole('link', { name: 'Beranda' })
      const firstMenuItem = firstMenuItems[1]
      expect(firstMenuItem).toHaveFocus()
    })

    test('focuses first menu item when menu opens', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const firstMenuItems = screen.getAllByRole('link', { name: 'Beranda' })
      const firstMenuItem = firstMenuItems[1]
      expect(firstMenuItem).toHaveFocus()
    })

    test('focuses menu button when menu closes', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const closeButton = screen.getByRole('button', { name: 'Tutup menu' })
      fireEvent.click(closeButton)
      
      expect(menuButton).toHaveFocus()
    })
  })

  describe('Body Scroll Lock', () => {
    test('locks body scroll when mobile menu is open', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    test('unlocks body scroll when mobile menu is closed', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const closeButton = screen.getByRole('button', { name: 'Tutup menu' })
      fireEvent.click(closeButton)
      
      expect(document.body.style.overflow).toBe('')
    })

    test('unlocks body scroll on cleanup', () => {
      const { unmount } = render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      unmount()
      
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for header background', () => {
      const { container } = render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('uses design tokens for shadow', () => {
      const { container } = render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('shadow-[var(--shadow-sm)]')
    })

    test('uses design tokens for logo color', () => {
      const { container } = render(<Header />)
      const logo = screen.getByRole('link', { name: /Mitra Banten News Beranda/ })
      expect(logo).toHaveClass('text-[hsl(var(--color-primary))]')
    })

    test('uses design tokens for navigation link hover', () => {
      const { container } = render(<Header />)
      const navLink = screen.getByRole('link', { name: 'Beranda' })
      expect(navLink).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })
  })

  describe('Accessibility', () => {
    test('header has role="banner"', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    test('nav element is present', () => {
      render(<Header />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    test('all interactive elements have focus styles', () => {
      render(<Header />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none')
        expect(link).toHaveClass('focus:ring-2')
      })
    })

    test('logo link has aria-label', () => {
      render(<Header />)
      const logo = screen.getByRole('link', { name: /Mitra Banten News Beranda/ })
      expect(logo).toHaveAccessibleName('Mitra Banten News Beranda')
    })

    test('menu button has screen reader only text', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      const srOnlyText = menuButton.querySelector('.sr-only')
      expect(srOnlyText).toBeInTheDocument()
    })

    test('mobile menu has border top', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      fireEvent.click(menuButton)
      
      const mobileMenu = document.getElementById('mobile-menu')
      expect(mobileMenu).toHaveClass('border-t')
    })
  })

  describe('Edge Cases', () => {
    test('handles rapid toggle clicks', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      
      fireEvent.click(menuButton)
      fireEvent.click(menuButton)
      fireEvent.click(menuButton)
      
      expect(document.getElementById('mobile-menu')).toBeInTheDocument()
    })

    test('handles keyboard events when menu is closed', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Buka menu' })
      
      fireEvent.keyDown(menuButton, { key: 'Escape' })
      
      expect(document.getElementById('mobile-menu')).not.toBeInTheDocument()
    })
  })
})
