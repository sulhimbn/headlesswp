import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'
import { memo } from 'react'

interface MetaInfoProps {
  author?: string
  date: string
  separator?: string
  className?: string
}

function MetaInfoComponent({ author = `${UI_TEXT.metaInfo.by} Admin`, date, separator = '•', className = '' }: MetaInfoProps) {
  const formattedDate = formatDate(date, 'full')

  return (
    <div className={`flex items-center space-x-4 text-sm text-[hsl(var(--color-text-muted))] ${className}`}>
      <span>{author}</span>
      <span aria-hidden="true">{separator}</span>
      <time dateTime={date}>
        {formattedDate}
      </time>
    </div>
  )
}

function arePropsEqual(prevProps: MetaInfoProps, nextProps: MetaInfoProps): boolean {
  return (
    prevProps.author === nextProps.author &&
    prevProps.date === nextProps.date &&
    prevProps.separator === nextProps.separator &&
    prevProps.className === nextProps.className
  )
}

export default memo(MetaInfoComponent, arePropsEqual)
