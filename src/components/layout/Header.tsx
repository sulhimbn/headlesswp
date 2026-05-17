'use client'

import { useState, useRef, useCallback, useEffect, memo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Icon from '@/components/ui/Icon'
import ServiceStatus from '@/components/ui/ServiceStatus'
import { UI_TEXT } from '@/lib/constants/uiText'
import { useDarkMode } from '@/lib/hooks/useDarkMode'
import KeyboardShortcutsProvider from '@/components/KeyboardShortcutsProvider'

const SearchBar = dynamic(() => import('@/components/ui/SearchBar'), { ssr: false })

const NAVIGATION_ITEMS = [
  { href: '/', label: UI_TEXT.header.navigation.home },
  { href: '/berita', label: UI_TEXT.header.navigation.news },
] as const

function HeaderComponent() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isDark, toggleDarkMode } = useDarkMode()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null)
  const lastMenuItemRef = useRef<HTMLAnchorElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      router.push(`/cari?q=${encodeURIComponent(query)}`)
    } else {
      router.push('/cari')
    }
  }, [router])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
    setIsMenuOpen(false)
    setTimeout(() => {
      if (!isSearchOpen) {
        searchInputRef.current?.focus()
      }
    }, 100)
  }, [isSearchOpen])

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => {
      if (!prev) {
        setTimeout(() => {
          firstMenuItemRef.current?.focus()
        }, 100)
      } else {
        setTimeout(() => {
          menuButtonRef.current?.focus()
        }, 100)
      }
      return !prev
    })
    setIsSearchOpen(false)
  }, [])

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

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
    setTimeout(() => {
      menuButtonRef.current?.focus()
    }, 100)
  }, [])

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

  return (
    <KeyboardShortcutsProvider searchInputRef={searchInputRef}>
      <header className="bg-[hsl(var(--color-surface))] shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a
              href="/"
              className="text-2xl font-bold text-[hsl(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
              aria-label={UI_TEXT.header.homeAriaLabel}
            >
              {UI_TEXT.header.siteName}
            </a>

            <div className="hidden md:flex items-center space-x-4">
              <ServiceStatus />
              <button
                ref={searchButtonRef}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                onClick={toggleSearch}
                aria-expanded={isSearchOpen}
                aria-controls="desktop-search"
              >
                <span className="sr-only">{UI_TEXT.header.openSearch}</span>
                <Icon type="search" className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                onClick={toggleDarkMode}
                aria-label={isDark ? UI_TEXT.header.darkMode.enableLight : UI_TEXT.header.darkMode.enableDark}
              >
                <Icon type={isDark ? 'sun' : 'moon'} className="h-5 w-5" />
              </button>
              <nav>
                {NAVIGATION_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)] px-2 py-1 transition-colors duration-[var(--transition-fast)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button
                ref={searchButtonRef}
                type="button"
                className="inline-flex items-center justify-center p-3 min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                onClick={toggleSearch}
                aria-expanded={isSearchOpen}
                aria-controls="mobile-search"
              >
                <span className="sr-only">{UI_TEXT.header.openSearch}</span>
                <Icon type="search" className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center p-3 min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                onClick={toggleDarkMode}
                aria-label={isDark ? UI_TEXT.header.darkMode.enableLight : UI_TEXT.header.darkMode.enableDark}
              >
                <Icon type={isDark ? 'sun' : 'moon'} className="h-5 w-5" />
              </button>
              <button
                ref={menuButtonRef}
                type="button"
                className="inline-flex items-center justify-center p-3 min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-haspopup="true"
                onClick={toggleMenu}
              >
                <span className="sr-only">{isMenuOpen ? UI_TEXT.header.closeMenu : UI_TEXT.header.openMenu}</span>
                {isMenuOpen ? <Icon type="close" className="h-6 w-6" /> : <Icon type="menu" className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <div
            ref={menuRef}
            className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]"
            onKeyDown={handleSearchKeyDown}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="max-w-2xl mx-auto">
                <Suspense fallback={<div className="h-10 sm:h-12 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-md)] animate-pulse" />}>
                  <SearchBar
                    ref={searchInputRef}
                    onSearch={handleSearch}
                    placeholder={UI_TEXT.search.placeholder}
                    ariaLabel={UI_TEXT.search.label}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-[hsl(var(--color-border))]"
            onKeyDown={handleKeyDown}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NAVIGATION_ITEMS.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  ref={
                    index === 0 ? firstMenuItemRef :
                    index === NAVIGATION_ITEMS.length - 1 ? lastMenuItemRef :
                    undefined
                  }
                  className="block px-4 py-3 min-h-[44px] flex items-center rounded-[var(--radius-md)] text-base font-medium text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>
    </KeyboardShortcutsProvider>
  )
}

export default memo(HeaderComponent)
