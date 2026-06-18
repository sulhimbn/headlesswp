'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Icon from './Icon'
import { UI_TEXT } from '@/lib/constants/uiText'

interface SearchInputProps {
  placeholder?: string
  className?: string
  initialValue?: string
}

interface SearchResult {
  id: number
  title: { rendered: string }
  slug: string
}

export default function SearchInput({
  placeholder = UI_TEXT.search.placeholder,
  className = '',
  initialValue = ''
}: SearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts?search=${encodeURIComponent(searchQuery)}&per_page=5`)
      const data = await response.json()
      const posts = data.posts || []
      setResults(posts)
      setIsOpen(posts.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      search(query)
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, search])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(`/artikel/${result.slug}`)
    setIsOpen(false)
    setQuery('')
    setResults([])
    inputRef.current?.blur()
  }

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/cari?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} role="search">
        <label htmlFor="search-autocomplete" className="sr-only">
          {UI_TEXT.search.label}
        </label>
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
            <Icon type="search" className="h-5 w-5 text-[hsl(var(--color-text-muted))]" />
          </div>
          <input
            ref={inputRef}
            id="search-autocomplete"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="search-results-list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 2 && results.length > 0) {
                setIsOpen(true)
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 sm:py-3 text-sm sm:text-base bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[var(--transition-fast)]"
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)] transition-colors duration-[var(--transition-fast)]"
              aria-label={UI_TEXT.search.clear}
            >
              <Icon type="close" className="h-4 w-4" />
            </button>
          )}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-hidden="true">
              <Icon type="loading" className="h-4 w-4 animate-spin text-[hsl(var(--color-primary))]" />
            </div>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <ul
          id="search-results-list"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((result, index) => (
            <li
              key={result.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`px-4 py-3 cursor-pointer border-b border-[hsl(var(--color-border))] last:border-b-0 transition-colors duration-[var(--transition-fast)] ${
                index === selectedIndex
                  ? 'bg-[hsl(var(--color-primary))] text-white'
                  : 'text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-background-dark))]'
              }`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span
                className="block text-sm sm:text-base font-medium line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: result.title.rendered.replace(/<[^>]*>/g, '').slice(0, 100) 
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] shadow-lg p-4 text-center">
          <p className="text-sm text-[hsl(var(--color-text-muted))]">
            {UI_TEXT.searchPage.noResults}
          </p>
        </div>
      )}
    </div>
  )
}
