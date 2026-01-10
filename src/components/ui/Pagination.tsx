import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const pages: (number | string)[] = []
  const maxVisible = 5

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
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-3 py-2 text-sm font-medium text-[hsl(var(--color-text-secondary))] bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-secondary-dark))] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
          aria-label="Previous page"
        >
          ← Sebelumnya
        </Link>
      )}

      {pages.map((page, index) => (
        page === '...' ? (
          <span key={index} className="px-3 py-2 text-sm text-[hsl(var(--color-text-secondary))]">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
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
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-3 py-2 text-sm font-medium text-[hsl(var(--color-text-secondary))] bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-secondary-dark))] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
          aria-label="Next page"
        >
          Selanjutnya →
        </Link>
      )}
    </nav>
  )
}