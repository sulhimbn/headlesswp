'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import Icon from './Icon'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  isLoading?: boolean
  debounceMs?: number
  className?: string
  initialValue?: string
  ariaLabel?: string
}

function SearchBarComponent({
  onSearch,
  placeholder = 'Search...',
  isLoading = false,
  debounceMs = 300,
  className = '',
  initialValue = '',
  ariaLabel = 'Search'
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingQueryRef = useRef(initialValue)

  const handleSearch = useCallback((searchQuery: string) => {
    onSearch(searchQuery)
  }, [onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    pendingQueryRef.current = newValue
  }

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, debounceMs])

  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery, handleSearch])

  const handleClear = () => {
    const emptyValue = ''
    setQuery(emptyValue)
    pendingQueryRef.current = emptyValue
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(pendingQueryRef.current)
  }

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
          value={query}
          onChange={handleInputChange}
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
            aria-label="Clear search"
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
  )
}

function arePropsEqual(prevProps: SearchBarProps, nextProps: SearchBarProps): boolean {
  return (
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.debounceMs === nextProps.debounceMs &&
    prevProps.className === nextProps.className &&
    prevProps.initialValue === nextProps.initialValue &&
    prevProps.ariaLabel === nextProps.ariaLabel &&
    prevProps.onSearch === nextProps.onSearch
  )
}

export default memo(SearchBarComponent, arePropsEqual)
