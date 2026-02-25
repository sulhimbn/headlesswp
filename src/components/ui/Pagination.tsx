import Link from 'next/link'
import { memo } from 'react'
import { PAGINATION } from '@/lib/api/config'
import { UI_TEXT } from '@/lib/constants/uiText'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  query?: Record<string, string>
}

function PaginationComponent({ currentPage, totalPages, basePath, query = {} }: PaginationProps) {
  const pages: (number | string)[] = []
  const maxVisible = PAGINATION.MAX_VISIBLE_PAGES

  const buildHref = (page: number): string => {
    const queryParams = new URLSearchParams({ ...query, page: page.toString() })
    return `${basePath}?${queryParams.toString()}`
  }

  const getFirstPageHref = (): string => {
    const queryParams = new URLSearchParams(query).toString()
    return queryParams ? `${basePath}?${queryParams}` : basePath
  }

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(currentPage - 1)
      pages.push(currentPage)
      pages.push(currentPage + 1)
      pages.push('...')
      pages.push(totalPages)
    }
  }

  return (
    <nav className="flex items-center justify-center space-x-2 mt-8" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-[hsl(var(--color-text-secondary))] bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-secondary-dark))] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
          aria-label="Previous page"
        >
          ← {UI_TEXT.pagination.previous}
        </Link>
      )}

      {pages.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-[hsl(var(--color-text-secondary))]">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={page === 1 ? getFirstPageHref() : buildHref(page as number)}
            className={`px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 transition-colors duration-[var(--transition-fast)] ${
              currentPage === page
                ? 'bg-[hsl(var(--color-primary))] text-white'
                : 'bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-secondary))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-secondary-dark))]'
            }`}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Link>
        )
      ))}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-[hsl(var(--color-text-secondary))] bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-secondary-dark))] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
          aria-label="Next page"
        >
          {UI_TEXT.pagination.next} →
        </Link>
      )}
    </nav>
  )
}

function arePropsEqual(prevProps: PaginationProps, nextProps: PaginationProps): boolean {
  return (
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.basePath === nextProps.basePath
  )
}

export default memo(PaginationComponent, arePropsEqual)