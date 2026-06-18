'use client'

import { useMemo, useCallback } from 'react'

export interface PaginationOptions {
  searchParams: { page?: string }
  basePath: string
}

export interface UsePaginationReturn {
  currentPage: number
  basePath: string
  getPageUrl: (page: number) => string
}

export function usePagination({ searchParams, basePath }: PaginationOptions): UsePaginationReturn {
  const currentPage = useMemo(() => {
    const pageParam = searchParams.page
    if (!pageParam) return 1
    const parsed = parseInt(pageParam, 10)
    return isNaN(parsed) || parsed < 1 ? 1 : parsed
  }, [searchParams.page])

  const getPageUrl = useCallback((page: number): string => {
    if (page <= 1) {
      return basePath
    }
    return `${basePath}?page=${page}`
  }, [basePath])

  return {
    currentPage,
    basePath,
    getPageUrl
  }
}

export function parsePageNumber(searchParams: { page?: string }): number {
  const pageParam = searchParams.page
  if (!pageParam) return 1
  const parsed = parseInt(pageParam, 10)
  return isNaN(parsed) || parsed < 1 ? 1 : parsed
}

export function buildPaginationUrl(basePath: string, page: number): string {
  if (page <= 1) {
    return basePath
  }
  return `${basePath}?page=${page}`
}
