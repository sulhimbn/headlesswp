import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'

interface MetaInfoProps {
  author?: string
  date: string
  separator?: string
  className?: string
}

export default function MetaInfo({ author = 'By Admin', date, separator = '•', className = '' }: MetaInfoProps) {
  const formattedDate = formatDate(date, 'full')
  const defaultAuthor = `${UI_TEXT.metaInfo.by} Admin`

  return (
    <div className={`flex items-center space-x-4 text-sm text-gray-500 ${className}`}>
      <span>{author}</span>
      <span aria-hidden="true">{separator}</span>
      <time dateTime={date}>
        {formattedDate}
      </time>
    </div>
  )
}
