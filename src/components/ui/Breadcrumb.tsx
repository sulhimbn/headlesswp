import Link from 'next/link'
import { UI_TEXT } from '@/lib/constants/uiText'
import { memo } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

function BreadcrumbComponent({ items }: BreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)] text-sm"
          >
            {UI_TEXT.breadcrumb.home}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            <svg
              className="w-3 h-3 text-[hsl(var(--color-text-muted))] mx-1"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            {index === items.length - 1 ? (
              <span className="ml-1 text-sm font-medium text-[hsl(var(--color-text-muted))] md:ml-2">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="ml-1 text-sm font-medium text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] md:ml-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function arePropsEqual(prevProps: BreadcrumbProps, nextProps: BreadcrumbProps): boolean {
  if (prevProps.items.length !== nextProps.items.length) {
    return false
  }
  return prevProps.items.every((item, index) => 
    item.label === nextProps.items[index].label &&
    item.href === nextProps.items[index].href
  )
}

export default memo(BreadcrumbComponent, arePropsEqual)
