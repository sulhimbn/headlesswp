'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import Icon from './Icon'
import { UI_TEXT } from '@/lib/constants/uiText'

interface AutocompleteResult {
  id: number
  title: string
  slug: string
  excerpt: string
}

interface SearchAutocompleteProps {
  placeholder?: string
  debounceMs?: number
  className?: string
  initialValue?: string
  ariaLabel?: string
}

function SearchAutocompleteComponent({
  placeholder = UI_TEXT.search.placeholder,
  debounceMs = 300,
  className = '',
  initialValue = '',
  ariaLabel = UI_TEXT.search.label
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<AutocompleteResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const router = useRouter()

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: abortControllerRef.current.signal
      })
      const data = await response.json()
      
      if (data.results) {
        setResults(data.results)
        setIsOpen(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      fetchResults(query)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [query, debounceMs, fetchResults])

  const handleSelect = useCallback((result: AutocompleteResult) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/cari?q=${encodeURIComponent(result.title)}`)
  }, [router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setResults([])
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        } else {
          setIsOpen(false)
          router.push(`/cari?q=${encodeURIComponent(query)}`)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setResults([])
        inputRef.current?.blur()
        break
      case 'Tab':
        setIsOpen(false)
        setResults([])
        break
    }
  }, [isOpen, results, selectedIndex, handleSelect, router, query])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsOpen(false)
    if (query.trim()) {
      router.push(`/cari?q=${encodeURIComponent(query)}`)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`} role="search">
      <label htmlFor="search-input" className="sr-only">
        {ariaLabel}
      </label>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
          <Icon type="search" className="h-5 w-5 text-[hsl(var(--color-text-muted))]" />
        </div>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-results"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-10 pr-10 py-2 sm:py-3 text-sm sm:text-base bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[var(--transition-fast)]"
          aria-label={ariaLabel}
          aria-busy={isLoading}
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

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] max-h-80 overflow-y-auto"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:bg-[hsl(var(--color-secondary-dark))] transition-colors duration-[var(--transition-fast)] ${
                index === selectedIndex ? 'bg-[hsl(var(--color-secondary-dark))]' : ''
              }`}
            >
              <div className="font-medium text-[hsl(var(--color-text-primary))] line-clamp-1">
                {result.title}
              </div>
              {result.excerpt && (
                <div className="text-sm text-[hsl(var(--color-text-muted))] line-clamp-1 mt-0.5">
                  {result.excerpt}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

export default memo(SearchAutocompleteComponent)