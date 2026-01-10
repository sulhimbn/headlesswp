const DEFAULT_LOCALE = 'id-ID'

export type DateFormat = 'full' | 'short' | 'month-day' | 'month-year'

interface DateFormatOptions {
  day?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  year?: 'numeric' | '2-digit'
}

const DATE_FORMAT_OPTIONS: Record<DateFormat, DateFormatOptions> = {
  full: {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  },
  short: {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  },
  'month-day': {
    day: 'numeric',
    month: 'long'
  },
  'month-year': {
    month: 'long',
    year: 'numeric'
  }
}

export function formatDate(
  date: string | Date,
  format: DateFormat = 'full',
  locale: string = DEFAULT_LOCALE
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  const options = DATE_FORMAT_OPTIONS[format]

  return dateObj.toLocaleDateString(locale, options)
}

export function formatDateTime(
  date: string | Date,
  locale: string = DEFAULT_LOCALE
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(
  date: string | Date,
  locale: string = DEFAULT_LOCALE
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateRelative(
  date: string | Date,
  locale: string = DEFAULT_LOCALE
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'baru saja'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`
  }

  if (diffHours < 24) {
    return `${diffHours} jam lalu`
  }

  if (diffDays === 1) {
    return 'kemarin'
  }

  if (diffDays < 7) {
    return `${diffDays} hari lalu`
  }

  return formatDate(dateObj, 'short', locale)
}