'use client'

import { useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PARSING } from '@/lib/constants/appConstants'

export interface PaginationConfig {
  currentPage: number
  totalPages: number
  basePath: string
  perPage?: number
}

export interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  getPageUrl: (page: number) => string
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToPage: (page: number) => void
}

export function usePagination(config: PaginationConfig): UsePaginationReturn {
  const { currentPage, totalPages } = config
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const getPageUrl = useCallback((page: number): string => {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }, [pathname, searchParams])

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      router.push(getPageUrl(currentPage + 1))
    }
  }, [currentPage, hasNextPage, router, getPageUrl])

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      router.push(getPageUrl(currentPage - 1))
    }
  }, [currentPage, hasPreviousPage, router, getPageUrl])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      router.push(getPageUrl(page))
    }
  }, [currentPage, totalPages, router, getPageUrl])

  return useMemo(() => ({
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    getPageUrl,
    goToNextPage,
    goToPreviousPage,
    goToPage
  }), [currentPage, totalPages, hasNextPage, hasPreviousPage, getPageUrl, goToNextPage, goToPreviousPage, goToPage])
}

export function parsePageFromParams(searchParams: { page?: string | string[] }): number {
  const pageParam = searchParams.page
  if (!pageParam) return 1
  
  const parsed = parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam, PARSING.DECIMAL_RADIX)
  return isNaN(parsed) || parsed < 1 ? 1 : parsed
}

export function buildPaginationUrl(basePath: string, page: number): string {
  if (page <= 1) {
    return basePath
  }
  return `${basePath}?page=${page}`
}

export function buildPaginationUrls(
  currentPage: number,
  totalPages: number,
  basePath: string
): {
  previousUrl: string | null
  nextUrl: string | null
  currentUrl: string
} {
  const previousUrl = currentPage > 1 ? buildPaginationUrl(basePath, currentPage - 1) : null
  const nextUrl = currentPage < totalPages ? buildPaginationUrl(basePath, currentPage + 1) : null
  const currentUrl = buildPaginationUrl(basePath, currentPage)
  
  return { previousUrl, nextUrl, currentUrl }
}

export const DEFAULT_PER_PAGE = 12