'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, memo } from 'react'
import Icon from '@/components/ui/Icon'
import SearchBar from '@/components/ui/SearchBar'
import { UI_TEXT } from '@/lib/constants/uiText'

const NAVIGATION_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/berita', label: 'Berita' },
  { href: '/politik', label: 'Politik' },
  { href: '/ekonomi', label: 'Ekonomi' },
  { href: '/olahraga', label: 'Olahraga' },
] as const

export default memo(function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null)
  const lastMenuItemRef = useRef<HTMLAnchorElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMenuOpen) {
      firstMenuItemRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      menuButtonRef.current?.focus()
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(false)
      setIsSearchOpen(false)
    }
    if (e.key === 'Tab' && !e.shiftKey && document.activeElement === lastMenuItemRef.current) {
      e.preventDefault()
      firstMenuItemRef.current?.focus()
    }
    if (e.key === 'Tab' && e.shiftKey && document.activeElement === firstMenuItemRef.current) {
      e.preventDefault()
      lastMenuItemRef.current?.focus()
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/cari?q=${encodeURIComponent(query)}`)
    } else {
      router.push('/cari')
    }
  }

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-[hsl(var(--color-surface))] shadow-[var(--shadow-sm)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-2xl font-bold text-[hsl(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
            aria-label="Mitra Banten News Beranda"
          >
            Mitra Banten News
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <button
              ref={searchButtonRef}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
              onClick={toggleSearch}
              aria-expanded={isSearchOpen}
              aria-controls="desktop-search"
            >
              <span className="sr-only">Buka pencarian</span>
              <Icon type="search" className="h-5 w-5" />
            </button>
            <nav>
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)] px-2 py-1 transition-colors duration-[var(--transition-fast)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
              onClick={toggleSearch}
              aria-expanded={isSearchOpen}
              aria-controls="mobile-search"
            >
              <span className="sr-only">Buka pencarian</span>
              <Icon type="search" className="h-5 w-5" />
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="true"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen)
                setIsSearchOpen(false)
              }}
            >
              <span className="sr-only">{isMenuOpen ? 'Tutup menu' : 'Buka menu'}</span>
              {isMenuOpen ? <Icon type="close" className="h-6 w-6" /> : <Icon type="menu" className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div
          ref={searchRef}
          className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]"
          onKeyDown={handleSearchKeyDown}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-2xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder={UI_TEXT.search.placeholder}
                ariaLabel={UI_TEXT.search.label}
              />
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className="md:hidden border-t border-[hsl(var(--color-border))]"
          onKeyDown={handleKeyDown}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAVIGATION_ITEMS.map((item, index) => (
              <Link
                key={item.href}
                ref={
                  index === 0 ? firstMenuItemRef :
                  index === NAVIGATION_ITEMS.length - 1 ? lastMenuItemRef :
                  undefined
                }
                href={item.href}
                className="block px-3 py-2 rounded-[var(--radius-md)] text-base font-medium text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
})
