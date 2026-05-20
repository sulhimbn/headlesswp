'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Icon from './Icon'
import { UI_TEXT } from '@/lib/constants/uiText'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  isLoading?: boolean
  debounceMs?: number
  className?: string
  initialValue?: string
  ariaLabel?: string
  persistToUrl?: boolean
}

function SearchBarComponent({
  onSearch,
  placeholder = UI_TEXT.search.placeholder,
  isLoading = false,
  debounceMs = 300,
  className = '',
  initialValue = '',
  ariaLabel = UI_TEXT.search.label,
  persistToUrl = false
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams?.get('q') || ''
  const [query, setQuery] = useState(persistToUrl ? (urlQuery || initialValue) : initialValue)
  const [debouncedQuery, setDebouncedQuery] = useState(persistToUrl ? urlQuery : initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingQueryRef = useRef(persistToUrl ? urlQuery : initialValue)

  const handleSearch = useCallback((searchQuery: string) => {
    if (onSearch) {
      onSearch(searchQuery)
    }
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
    if (persistToUrl) {
      router.push('/cari')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const searchValue = pendingQueryRef.current.trim()
    if (persistToUrl && searchValue) {
      router.push(`/cari?q=${encodeURIComponent(searchValue)}`)
    } else if (onSearch) {
      onSearch(searchValue)
    }
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
          role="searchbox"
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
    prevProps.onSearch === nextProps.onSearch &&
    prevProps.persistToUrl === nextProps.persistToUrl
  )
}

export default memo(SearchBarComponent, arePropsEqual)
