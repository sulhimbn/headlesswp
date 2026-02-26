import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'
import { memo } from 'react'

interface MetaInfoProps {
  author?: string
  date: string
  separator?: string
  className?: string
  readingTime?: number
}

function MetaInfoComponent({ author = `${UI_TEXT.metaInfo.by} Admin`, date, separator = '•', className = '', readingTime }: MetaInfoProps) {
  const formattedDate = formatDate(date, 'full')

  return (
    <div 
      className={`flex items-center space-x-4 text-sm text-[hsl(var(--color-text-muted))] ${className}`}
      aria-label={`Ditulis oleh ${author} pada ${formattedDate}`}
    >
      <span>{author}</span>
      <span aria-hidden="true">{separator}</span>
      <time dateTime={date}>
        {formattedDate}
      </time>
      {readingTime !== undefined && readingTime > 0 && (
        <>
          <span aria-hidden="true">{separator}</span>
          <span>{readingTime} {UI_TEXT.metaInfo.readingTime}</span>
        </>
      )}
    </div>
  )
}

function arePropsEqual(prevProps: MetaInfoProps, nextProps: MetaInfoProps): boolean {
  return (
    prevProps.author === nextProps.author &&
    prevProps.date === nextProps.date &&
    prevProps.separator === nextProps.separator &&
    prevProps.className === nextProps.className &&
    prevProps.readingTime === nextProps.readingTime
  )
}

export default memo(MetaInfoComponent, arePropsEqual)
