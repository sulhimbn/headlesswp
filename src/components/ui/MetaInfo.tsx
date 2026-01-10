import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'

interface MetaInfoProps {
  author?: string
  date: string
  separator?: string
  className?: string
}

 export default function MetaInfo({ author = `${UI_TEXT.metaInfo.by} Admin`, date, separator = '•', className = '' }: MetaInfoProps) {
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
