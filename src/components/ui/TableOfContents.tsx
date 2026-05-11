import { memo, useState, useEffect, useRef } from 'react'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { TocHeading } from '@/lib/utils/tableOfContents'

interface TableOfContentsProps {
  headings: TocHeading[]
  className?: string
}

function TableOfContentsComponent({ headings, className = '' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((prev, current) => {
            return prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current
          })
          setActiveId(topEntry.target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    observerRef.current = observer

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [headings])

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
      setActiveId(id)
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

  const getActiveClass = (id: string): string => {
    if (activeId === id) {
      return 'text-[hsl(var(--color-primary))] font-medium border-l-2 border-[hsl(var(--color-primary))] -ml-[2px]'
    }
    return ''
  }

  return (
    <nav 
      className={`sticky top-20 bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)] ${className}`}
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
              className={`block text-sm text-[hsl(var(--color-text-secondary))] hover:text-[hsl(var(--color-primary))] transition-colors duration-[var(--transition-fast)] ${getIndentClass(heading.level)} ${getActiveClass(heading.id)}`}
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