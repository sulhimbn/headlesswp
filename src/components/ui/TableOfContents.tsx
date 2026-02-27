import { memo } from 'react'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { TocHeading } from '@/lib/utils/tableOfContents'

interface TableOfContentsProps {
  headings: TocHeading[]
  className?: string
}

function TableOfContentsComponent({ headings, className = '' }: TableOfContentsProps) {
  if (headings.length === 0) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const getIndentClass = (level: number): string => {
    const indentMap: Record<number, string> = {
      2: 'pl-0',
      3: 'pl-4',
      4: 'pl-8',
      5: 'pl-12',
      6: 'pl-16',
    }
    return indentMap[level] || 'pl-0'
  }

  return (
    <nav 
      className={`bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)] ${className}`}
      aria-label={UI_TEXT.postDetail.tableOfContents}
    >
      <h2 className="text-sm font-semibold text-[hsl(var(--color-text-primary))] mb-3">
        {UI_TEXT.postDetail.tableOfContents}
      </h2>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`block text-sm text-[hsl(var(--color-text-secondary))] hover:text-[hsl(var(--color-primary))] transition-colors duration-[var(--transition-fast)] ${getIndentClass(heading.level)}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default memo(TableOfContentsComponent)
